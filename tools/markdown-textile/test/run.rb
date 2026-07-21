#!/usr/bin/env ruby
# Conversion-correctness suite for the Markdown -> Textile converter.
#
# For each case in cases.rb it renders the original markdown to HTML via
# CommonMarker, runs the JS converter to produce Textile, renders that
# Textile to HTML via vendored RedCloth3 (Redmine's formatter), then asserts
# the two normalized HTML strings are equal.
#
# See README.md for scope (what is and is not covered).

require 'English'
require 'open3'

VENDOR_DIR = File.expand_path('../vendor/redmine', __dir__)
TEST_DIR   = File.expand_path('..', __dir__)
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

CONVERTER_JS = File.expand_path('../js/markdown-to-textile.js', __dir__)

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
    const M = require("#{CONVERTER_JS}");
    const input = fs.readFileSync(0, 'utf8');
    process.stdout.write(new M().convert(input));
  JS
  output, status = Open3.capture2('node', '-e', script, stdin_data: markdown)
  raise "node converter failed (exit #{status.exitstatus}): #{output}" unless status.success?
  output
end

require 'open3'

def run_case(test_case)
  md_html = render_markdown(test_case[:markdown])
  textile = convert_to_textile(test_case[:markdown])
  tx_html = render_textile(textile)
  [md_html, textile, tx_html]
end

def show_diff(name, expected, actual, textile, md_html)
  warn "FAIL: #{name}"
  warn "  converted textile:  #{textile.inspect}"
  warn "  expected md html:   #{expected.inspect}"
  warn "  actual textile html: #{actual.inspect}"
  warn ""
end

def generate_report(passes, fails)
  total = passes + fails
  puts ''
  puts "#{passes}/#{total} pass; #{fails} fail"
  fails.zero? ? 0 : 1
end

passes = 0
fails  = 0
failures = []

CASES.each do |test_case|
  name = test_case[:name]
  $stdout.print "  #{name} ... "
  $stdout.flush
  begin
    md_html, textile, tx_html = run_case(test_case)
    expected = HtmlNormalize.normalize_html(md_html)
    actual   = HtmlNormalize.normalize_html(tx_html)
    if expected == actual
      puts "PASS"
      passes += 1
    else
      puts "FAIL"
      show_diff(name, expected, actual, textile, md_html)
      fails += 1
      failures << name
    end
  rescue StandardError => e
    puts "ERR: #{e.message}"
    fails += 1
    failures << name
  end
  $stdout.flush
end

exit generate_report(passes, fails)