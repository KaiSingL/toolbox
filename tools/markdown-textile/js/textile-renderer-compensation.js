function compensateRendererDiffs(html) {
    if (typeof html !== 'string') return html;

    html = html
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8212;/g, '--')
        .replace(/&#8211;/g, '-')
        .replace(/&#8230;/g, '...')
        .replace(/&#8217;/g, "'");

    html = html.replace(/<acronym\b[^>]*>([\s\S]*?)<\/acronym>/gi, '$1');

    html = html.replace(/<span\s+class="caps">([\s\S]*?)<\/span>/gi, '$1');

    return html;
}

function compensateBlockquotes(textile) {
    if (typeof textile !== 'string' || !/^>/m.test(textile)) return textile;

    return textile.replace(/(^>+([^\n]*?)(\n|$))+/m, (match) => {
        const lines = match.split('\n').filter(l => l.length > 0);
        let result = '';
        let indent = 0;

        for (const line of lines) {
            const lineMatch = line.match(/^([> ]+)(.*)$/);
            if (!lineMatch) continue;

            const bq = lineMatch[1];
            const content = lineMatch[2];
            const level = (bq.match(/>/g) || []).length;

            if (level !== indent) {
                if (level > indent) {
                    result += '<blockquote>'.repeat(level - indent);
                } else {
                    result += '</blockquote>'.repeat(indent - level);
                }
                indent = level;
            }

            if (content.trim()) {
                result += '<p>' + content + '</p>';
            }
        }

        result += '</blockquote>'.repeat(indent);
        return result;
    });
}

if (typeof window !== 'undefined') {
    window.compensateRendererDiffs = compensateRendererDiffs;
    window.compensateBlockquotes = compensateBlockquotes;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { compensateRendererDiffs, compensateBlockquotes };
}