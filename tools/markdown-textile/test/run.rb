#!/usr/bin/env ruby
# Conversion-correctness suite for the Markdown <-> Textile converter.
#
# Forward direction (Markdown -> Textile):
#   For each case, CommonMarker renders the markdown to HTML (expected),
#   the JS converter produces Textile, RedCloth3 renders that Textile to
#   HTML (actual), and the two normalized HTML strings are compared.
#
# Reverse direction (Textile -> Markdown):
#   For each hand-written Textile fixture and each auto-paired case (derived
#   from the forward direction), RedCloth3 renders the textile to HTML
#   (expected), the JS converter produces Markdown, CommonMarker renders
#   that Markdown to HTML (actual), and the two are compared.
#
# Output sanity checks the raw converter output for cosmetic bugs invisible
# to HTML comparison.
#
# See README.md for scope.

require 'json'
require 'open3'

VENDOR_DIR = File.expand_path('../vendor/redmine', __dir__)
TOOL_DIR   = File.expand_path('..', __dir__)

require_relative '../vendor/redmine/polyfills'
require_relative '../vendor/redmine/url'
require_relative '../vendor/redmine/redcloth3'
require_relative 'html_normalize'
require_relative 'sanity_check'
require_relative 'cases'

begin
  require 'commonmarker'
rescue LoadError
  warn "ERROR: the 'commonmarker' gem is required for the conversion-correctness suite."
  warn "Install it with:  gem install commonmarker"
  warn "Requires Ruby >= 3.2. See tools/markdown-textile/test/README.md."
  exit 1
end

unless system('node --version > NUL')
  warn "ERROR: 'node' must be on PATH for the conversion-correctness suite."
  exit 1
end

FORWARD_CONVERTER_JS = File.expand_path('../js/markdown-to-textile.js', __dir__)
REVERSE_CONVERTER_JS = File.expand_path('../js/convert-textile-to-markdown.js', __dir__)

MARKDOWN_OPTIONS = {
  render: { hardbreaks: false },
  extension: { autolink: false, header_ids: nil }
}.freeze
MARKDOWN_PLUGINS = { syntax_highlighter: nil }.freeze

def render_markdown(markdown)
  Commonmarker.to_html(markdown, options: MARKDOWN_OPTIONS, plugins: MARKDOWN_PLUGINS)
end

def render_textile(textile)
  RedCloth3.new(textile).to_html
end

def batch_convert_to_textile(markdowns)
  script = <<~JS
    const fs = require('fs');
    const M = require("#{FORWARD_CONVERTER_JS}");
    const inputs = JSON.parse(fs.readFileSync(0, 'utf8'));
    const outputs = inputs.map(i => new M().convert(i));
    process.stdout.write(JSON.stringify(outputs));
  JS
  output, status = Open3.capture2('node', '-e', script, stdin_data: JSON.generate(markdowns))
  raise "node forward batch failed (exit #{status.exitstatus}): #{output}" unless status.success?
  JSON.parse(output)
end

def batch_convert_to_markdown(textiles)
  script = <<~JS
    const fs = require('fs');
    const m = require("#{REVERSE_CONVERTER_JS}");
    const inputs = JSON.parse(fs.readFileSync(0, 'utf8'));
    const outputs = inputs.map(i => m.convertTextileToMarkdown(i));
    process.stdout.write(JSON.stringify(outputs));
  JS
  output, status = Open3.capture2('node', '-e', script, stdin_data: JSON.generate(textiles))
  raise "node reverse batch failed (exit #{status.exitstatus}): #{output}" unless status.success?
  JSON.parse(output)
end

def check_case(name, expected_html, actual_html, context = {})
  expected = HtmlNormalize.normalize_html(expected_html)
  actual   = HtmlNormalize.normalize_html(actual_html)
  if expected == actual
    puts "PASS"
    return true
  else
    puts "FAIL"
    warn "  expected: #{expected.inspect}"
    warn "  actual:   #{actual.inspect}"
    context.each { |k, v| warn "  #{k}: #{v.inspect}" } unless context.empty?
    warn ""
    return false
  end
end

# --- Pre-compute all conversions in two node batches ---
puts "Converting (forward batch)..."
forward_markdowns = CASES.map { |tc| tc[:markdown] }
forward_textiles  = batch_convert_to_textile(forward_markdowns)

reverse_handwritten_textiles = REVERSE_CASES.map { |tc| tc[:textile] }
auto_paired_textiles = CASES.each_with_index.map { |tc, i| forward_textiles[i] }
all_reverse_textiles = reverse_handwritten_textiles + auto_paired_textiles

puts "Converting (reverse batch)..."
all_reverse_markdowns = batch_convert_to_markdown(all_reverse_textiles)
reverse_hw_markdowns  = all_reverse_markdowns.first(reverse_handwritten_textiles.length)
auto_paired_markdowns = all_reverse_markdowns.drop(reverse_handwritten_textiles.length)

# --- Forward direction ---
puts ""
puts "=== Forward (Markdown -> Textile) ==="
forward_passes = 0
forward_fails  = 0

CASES.each_with_index do |tc, i|
  name   = tc[:name]
  textile = forward_textiles[i]
  $stdout.print "  #{name} ... "
  $stdout.flush
  begin
    md_html = render_markdown(tc[:markdown])
    tx_html = render_textile(textile)
    if check_case(name, md_html, tx_html)
      forward_passes += 1
    else
      forward_fails += 1
    end
  rescue StandardError => e
    puts "ERR: #{e.message}"
    forward_fails += 1
  end
  $stdout.flush
end

# --- Reverse direction: hand-written fixtures ---
puts ""
puts "=== Reverse: hand-written (Textile -> Markdown) ==="
reverse_passes = 0
reverse_fails  = 0
reverse_outputs = []

REVERSE_CASES.each_with_index do |tc, i|
  name     = tc[:name]
  markdown = reverse_hw_markdowns[i]
  $stdout.print "  #{name} ... "
  $stdout.flush
  begin
    tx_html = render_textile(tc[:textile])
    md_html = render_markdown(markdown)
    reverse_outputs << { name: name, markdown: markdown }
    if check_case(name, tx_html, md_html, { markdown: markdown })
      reverse_passes += 1
    else
      reverse_fails += 1
    end
  rescue StandardError => e
    puts "ERR: #{e.message}"
    reverse_fails += 1
  end
  $stdout.flush
end

# --- Reverse direction: auto-paired (from forward cases) ---
puts ""
puts "=== Reverse: auto-paired (Textile -> Markdown) ==="
auto_passes = 0
auto_fails  = 0

CASES.each_with_index do |tc, i|
  name     = "auto: #{tc[:name]}"
  markdown = auto_paired_markdowns[i]
  textile  = forward_textiles[i]
  $stdout.print "  #{name} ... "
  $stdout.flush
  begin
    tx_html = render_textile(textile)
    md_html = render_markdown(markdown)
    reverse_outputs << { name: name, markdown: markdown }
    if check_case(name, tx_html, md_html, { markdown: markdown })
      auto_passes += 1
    else
      auto_fails += 1
    end
  rescue StandardError => e
    puts "ERR: #{e.message}"
    auto_fails += 1
  end
  $stdout.flush
end

# --- Output sanity (reverse direction) ---
puts ""
puts "=== Output sanity (reverse direction) ==="
sanity_passes = 0
sanity_fails  = 0
reverse_outputs.each do |o|
  issues = SanityCheck.issues(:reverse, o[:markdown])
  $stdout.print "  #{o[:name]} ... "
  $stdout.flush
  if issues.empty?
    puts "OK"
    sanity_passes += 1
  else
    puts "ISSUES"
    issues.each { |i| warn "    - #{i}" }
    sanity_fails += 1
  end
end

# --- Summary ---
puts ""
puts "Forward:              #{forward_passes}/#{forward_passes + forward_fails} pass"
puts "Reverse hand-written: #{reverse_passes}/#{reverse_passes + reverse_fails} pass"
puts "Reverse auto-paired:  #{auto_passes}/#{auto_passes + auto_fails} pass"
puts "Output sanity:        #{sanity_passes}/#{sanity_passes + sanity_fails} pass"
total_pass = forward_passes + reverse_passes + auto_passes + sanity_passes
total_fail = forward_fails + reverse_fails + auto_fails + sanity_fails
puts "Total:                #{total_pass}/#{total_pass + total_fail} pass; #{total_fail} fail"

exit(total_fail.zero? ? 0 : 1)
