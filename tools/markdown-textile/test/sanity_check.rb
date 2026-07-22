# Output sanity checks for the conversion-correctness suite.
#
# The HTML-equivalence comparison in run.rb catches semantic mismatches but is
# blind to cosmetic bugs in the converter's raw output that don't affect
# rendering (e.g. turndown over-escaping "4." as "4\." inside a heading —
# CommonMarker renders both identically). This module checks the converter's
# raw markdown output for known-bad patterns.
#
# To add a new pattern, append an entry to the relevant direction's array:
#   { name: '...',  check: ->(md) { ... boolean ... },
#     detail: ->(md) { ... array of matches ... } }

module SanityCheck
  PATTERNS = {
    reverse: [
      {
        name: 'escaped digit-dot in heading',
        check: ->(md) { md.match?(/^\#{1,6}\s+\d+\\\./) },
        detail: ->(md) { md.scan(/^\#{1,6}\s+\d+\\\./) }
      },
      {
        name: 'escaped greater-than at line start',
        check: ->(md) { md.match?(/^\\>/) },
        detail: ->(md) { md.scan(/^\\>.*/).flatten }
      }
    ],
    forward: [].freeze
  }.freeze

  def self.issues(direction, output)
    PATTERNS.fetch(direction, []).flat_map do |pattern|
      pattern[:check].call(output) ? ["#{pattern[:name]}: #{pattern[:detail].call(output).inspect}"] : []
    end
  end
end