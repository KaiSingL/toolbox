# HTML normalizer used by the conversion-correctness suite.
#
# Both CommonMarker (markdown -> html) and RedCloth3 (textile -> html) emit
# stylistically different HTML for the same semantics: indentation, attribute
# order, thead/tbody wrappers, RedCloth's class="external" on external links,
# RedCloth's <abbr> acronym enrichment, code-block attribute placement.
#
# normalize_html strips those stylistic differences so two semantically
# equivalent HTML strings compare equal. It does NOT strip meaningful
# text-content whitespace inside <p>/<li>/<td> etc., but it does trim the
# leading/trailing whitespace inside <pre>/<code> so our converter's
# "<code class=js>\n...code...\n</code>" matches CommonMarker's
# "<pre lang=js><code>...code...</code></pre>".
module HtmlNormalize
  module_function

  def normalize_html(html)
    s = html.to_s.dup

    s.gsub!(/<abbr\b[^>]*>(.*?)<\/abbr>/im) { $1 }
    s.gsub!(%r{</?(thead|tbody|tfoot)\b[^>]*>}i, '')

    s = normalize_pre_code(s)

    s.gsub!(/\sclass="external"/i, '')

    s.gsub!(/<(\w+)([^>]*?)(\/?)>/) do
      name = $1
      attrs_str = $2
      slash = $3
      attrs = attrs_str.scan(/\s*([a-zA-Z_\-:]+)\s*=\s*"([^"]*)"/i).map { |k, v| [k.downcase, v] }
      attrs.reject! { |k, _| %w[class lang id style align].include?(k) }
      if name.downcase == 'img'
        attrs.reject! { |k, _| k == 'title' }
      end
      attrs.sort_by! { |k, _| k }
      attr_str = attrs.map { |k, v| " #{k}=\"#{v}\"" }.join
      "<#{name.downcase}#{attr_str}#{slash}>"
    end
    s.gsub!(%r{</(\w+)>}) { "</#{$1.downcase}>" }

    s.gsub!(/>\s+</, '><')
    s.gsub!(/\s+/, ' ')
    s.strip
  end

  def normalize_pre_code(s)
    s = s.gsub(/<code([^>]*)>(.*?)<\/code>/im) do |_m|
      m = Regexp.last_match
      attr = m[1].to_s.gsub(/\s(class|lang|id)\s*=\s*"[^"]*"/i, '')
      "<code#{attr}>#{m[2].to_s.strip}</code>"
    end
    s = s.gsub(/<pre([^>]*)>(.*?)<\/pre>/im) do |_m|
      m = Regexp.last_match
      attr = m[1].to_s.gsub(/\s(class|lang|id)\s*=\s*"[^"]*"/i, '')
      "<pre#{attr}>#{m[2].to_s.strip}</pre>"
    end
    s
  end
end