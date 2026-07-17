function extractLanguage(className) {
    if (typeof className !== 'string') return '';
    const named = className.match(/(?:language-|lang-)(\S+)/);
    if (named) return named[1];
    const trimmed = className.trim();
    if (trimmed && trimmed !== 'text') return trimmed.split(/\s+/)[0];
    return '';
}

function formatFencedCode(className, textContent, fence) {
    const f = fence || '```';
    const language = extractLanguage(className);
    const code = (typeof textContent === 'string' ? textContent : '').replace(/^\n+|\n+$/g, '');
    return f + language + '\n' + code + '\n' + f;
}

if (typeof window !== 'undefined') {
    window.extractLanguage = extractLanguage;
    window.formatFencedCode = formatFencedCode;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extractLanguage, formatFencedCode };
}
