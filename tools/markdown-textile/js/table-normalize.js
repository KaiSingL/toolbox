function normalizeTableWhitespace(html) {
    if (typeof html !== 'string' || html.indexOf('<table') === -1) {
        return html;
    }
    return html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) =>
        table.replace(/>\s+</g, '><')
    );
}

function promoteBoldHeaderRows(html) {
    if (typeof html !== 'string' || html.indexOf('<table') === -1) {
        return html;
    }
    const boldCell = /<td><strong>[\s\S]*?<\/strong><\/td>/;
    return html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) => {
        // Find the first <tr> AFTER any <thead>/<tbody> opening.
        const trMatch = table.match(/<tr>([\s\S]*?)<\/tr>/);
        if (!trMatch) return table;
        const firstRowCells = trMatch[1];
        // Skip if the row already uses <th> (textile |_. syntax) — nothing to promote.
        if (/<th\b/i.test(firstRowCells)) return table;
        // Every cell in the first row must be a bold-only <td>.
        const cellPattern = /<td><strong>[\s\S]*?<\/strong><\/td>/g;
        const cells = firstRowCells.match(cellPattern);
        if (!cells || cells.length === 0) return table;
        if (cells.join('') !== firstRowCells) return table;
        // Promote <td>/<td> -> <th>/<th> in the first row only.
        const promoted = firstRowCells.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
        return table.replace(trMatch[0], '<tr>' + promoted + '</tr>');
    });
}

function normalizeTableHtml(html) {
    return promoteBoldHeaderRows(normalizeTableWhitespace(html));
}

if (typeof window !== 'undefined') {
    window.normalizeTableWhitespace = normalizeTableWhitespace;
    window.promoteBoldHeaderRows = promoteBoldHeaderRows;
    window.normalizeTableHtml = normalizeTableHtml;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normalizeTableWhitespace, promoteBoldHeaderRows, normalizeTableHtml };
}