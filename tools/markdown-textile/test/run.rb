#!/usr/bin/env ruby
# Conversion-correctness suite for the Markdown <-> Textile converter.
#
# Forward direction (Markdown -> Textile):
#   For each case, CommonMarker renders the markdown to HTML (expected),
#   the JS converter produces Textile, RedCloth3 renders that Textile to
#   HTML (actual), and the two normalized HTML strings are compared.
#
# Reverse direction (Textile -> Markdown):
#   For each hand-written textile fixture and each auto-paired case (derived
#   from the forward direction), RedCloth3 renders the textile to HTML
#   (expected), the JS converter produces Markdown, CommonMarker renders
#   that Markdown to HTML (actual), and the two are compared.
#
# See README.md for scope.

require 'open3'

VENDOR_DIR = File.expand_path('../vendor/redmine', __dir__)
TOOL_DIR   = File.expand_path('..', __dir__)

require_relative '../vendor/redmine/polyfills'
require_relative '../vendor/redmine/url'
require_relative '../vendor/redmine/redcloth3'
require_relative 'html_normalize'
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

FORWARD_CONVERTER_JS  = File.expand_path('../js/markdown-to-textile.js', __dir__)
REVERSE_CONVERTER_JS  = File.expand_path('../js/convert-textile-to-markdown.js', __dir__)

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

def convert_to_textile(markdown)
  script = <<~JS
    const fs = require('fs');
    const M = require("#{FORWARD_CONVERTER_JS}");
    const input = fs.readFileSync(0, 'utf8');
    process.stdout.write(new M().convert(input));
  JS
  output, status = Open3.capture2('node', '-e', script, stdin_data: markdown)
  raise "node forward converter failed (exit #{status.exitstatus}): #{output}" unless status.success?
  output
end

def convert_to_markdown(textile)
  script = <<~JS
    const fs = require('fs');
    const m = require("#{REVERSE_CONVERTER_JS}");
    const input = fs.readFileSync(0, 'utf8');
    process.stdout.write(m.convertTextileToMarkdown(input));
  JS
  output, status = Open3.capture2('node', '-e', script, stdin_data: textile)
  raise "node reverse converter failed (exit #{status.exitstatus}): #{output}" unless status.success?
  output
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

# --- Forward direction ---
puts "=== Forward (Markdown -> Textile) ==="
forward_passes = 0
forward_fails  = 0
forward_textiles = []

CASES.each do |tc|
  name = tc[:name]
  $stdout.print "  #{name} ... "
  $stdout.flush
  begin
    md_html   = render_markdown(tc[:markdown])
    textile   = convert_to_textile(tc[:markdown])
    tx_html   = render_textile(textile)
    forward_textiles << { name: name, textile: textile }
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

REVERSE_CASES.each do |tc|
  name = tc[:name]
  $stdout.print "  #{name} ... "
  $stdout.flush
  begin
    tx_html   = render_textile(tc[:textile])
    markdown  = convert_to_markdown(tc[:textile])
    md_html   = render_markdown(markdown)
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

forward_textiles.each do |ft|
  name = "auto: #{ft[:name]}"
  $stdout.print "  #{name} ... "
  $stdout.flush
  begin
    tx_html   = render_textile(ft[:textile])
    markdown  = convert_to_markdown(ft[:textile])
    md_html   = render_markdown(markdown)
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

# --- Summary ---
puts ""
puts "Forward:           #{forward_passes}/#{forward_passes + forward_fails} pass"
puts "Reverse hand-written: #{reverse_passes}/#{reverse_passes + reverse_fails} pass"
puts "Reverse auto-paired:  #{auto_passes}/#{auto_passes + auto_fails} pass"
total_pass = forward_passes + reverse_passes + auto_passes
total_fail = forward_fails + reverse_fails + auto_fails
puts "Total:             #{total_pass}/#{total_pass + total_fail} pass; #{total_fail} fail"

exit(total_fail.zero? ? 0 : 1)