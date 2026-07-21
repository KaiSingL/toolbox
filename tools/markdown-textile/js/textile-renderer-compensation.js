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

if (typeof window !== 'undefined') {
    window.compensateRendererDiffs = compensateRendererDiffs;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { compensateRendererDiffs };
}