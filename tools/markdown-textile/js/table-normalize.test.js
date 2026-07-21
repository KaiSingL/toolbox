const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTableWhitespace, promoteBoldHeaderRows, normalizeTableHtml } = require('./table-normalize.js');

describe('normalizeTableWhitespace', () => {
    it('collapses whitespace between table tags so header rows are detectable', () => {
        const html = '<table>\n\t<tr>\n\t\t<th>Name </th>\n\t\t<th>Age </th>\n\t</tr>\n\t<tr>\n\t\t<td> Alice </td>\n\t\t<td> 30 </td>\n\t</tr>\n</table>';
        assert.strictEqual(
            normalizeTableWhitespace(html),
            '<table><tr><th>Name </th><th>Age </th></tr><tr><td> Alice </td><td> 30 </td></tr></table>'
        );
    });

    it('leaves content outside tables untouched', () => {
        const html = '<p>keep\n\tthis</p>\n<table>\n\t<tr>\n\t\t<th>X</th>\n\t</tr>\n</table>\n<p>also keep\n</p>';
        assert.strictEqual(
            normalizeTableWhitespace(html),
            '<p>keep\n\tthis</p>\n<table><tr><th>X</th></tr></table>\n<p>also keep\n</p>'
        );
    });

    it('preserves whitespace inside pre and code blocks (scoped to table only)', () => {
        const html = '<pre>\n  line one\n  line two\n</pre>\n<table>\n\t<tr><th>A</th></tr>\n</table>';
        assert.strictEqual(
            normalizeTableWhitespace(html),
            '<pre>\n  line one\n  line two\n</pre>\n<table><tr><th>A</th></tr></table>'
        );
    });

    it('handles multiple tables in one input', () => {
        const html = '<table>\n\t<tr><th>A</th></tr>\n</table>\n<span>between</span>\n<table>\n\t<tr><td>B</td></tr>\n</table>';
        assert.strictEqual(
            normalizeTableWhitespace(html),
            '<table><tr><th>A</th></tr></table>\n<span>between</span>\n<table><tr><td>B</td></tr></table>'
        );
    });

    it('passes through non-table html unchanged', () => {
        const html = '<div>\n\t<p>hello</p>\n</div>';
        assert.strictEqual(normalizeTableWhitespace(html), html);
    });

    it('passes through empty and non-string input unchanged', () => {
        assert.strictEqual(normalizeTableWhitespace(''), '');
        assert.strictEqual(normalizeTableWhitespace(null), null);
        assert.strictEqual(normalizeTableWhitespace(undefined), undefined);
    });

    it('does not collapse whitespace inside th/td text content', () => {
        const html = '<table>\n\t<tr>\n\t\t<td>keep this spacing  here</td>\n\t</tr>\n</table>';
        assert.strictEqual(
            normalizeTableWhitespace(html),
            '<table><tr><td>keep this spacing  here</td></tr></table>'
        );
    });
});

describe('promoteBoldHeaderRows', () => {
    it('promotes a bold-only first row to th (Redmine | *h* | idiom)', () => {
        const html = '<table><tr><td><strong>Component</strong></td><td><strong>Lifetime</strong></td></tr><tr><td>Login session</td><td>Normal</td></tr></table>';
        assert.strictEqual(
            promoteBoldHeaderRows(html),
            '<table><tr><th><strong>Component</strong></th><th><strong>Lifetime</strong></th></tr><tr><td>Login session</td><td>Normal</td></tr></table>'
        );
    });

    it('leaves data rows as td', () => {
        const html = '<table><tr><td><strong>H</strong></td></tr><tr><td>A</td></tr><tr><td>B</td></tr></table>';
        const result = promoteBoldHeaderRows(html);
        assert.ok(result.includes('<tr><th><strong>H</strong></th></tr>'));
        assert.ok(result.includes('<tr><td>A</td></tr>'));
        assert.ok(result.includes('<tr><td>B</td></tr>'));
    });

    it('skips promotion when first row already uses th (textile |_. syntax)', () => {
        const html = '<table><tr><th>Name</th><th>Age</th></tr><tr><td>Alice</td><td>30</td></tr></table>';
        assert.strictEqual(promoteBoldHeaderRows(html), html);
    });

    it('skips promotion when first row has a non-bold cell', () => {
        const html = '<table><tr><td><strong>H</strong></td><td>plain</td></tr><tr><td>A</td></tr></table>';
        assert.strictEqual(promoteBoldHeaderRows(html), html);
    });

    it('skips promotion when first row is not bold at all', () => {
        const html = '<table><tr><td>Component</td><td>Lifetime</td></tr><tr><td>x</td></tr></table>';
        assert.strictEqual(promoteBoldHeaderRows(html), html);
    });

    it('promotes the first tr only, even if a later row is also bold-only', () => {
        const html = '<table><tr><td><strong>H1</strong></td></tr><tr><td><strong>H2</strong></td></tr></table>';
        const result = promoteBoldHeaderRows(html);
        assert.ok(result.indexOf('<th><strong>H1</strong></th>') !== -1);
        assert.ok(result.indexOf('<td><strong>H2</strong></td>') !== -1, 'later bold row must NOT be promoted');
    });

    it('promotes each table independently when multiple bold-header tables present', () => {
        const html = '<table><tr><td><strong>A</strong></td></tr></table><table><tr><td><strong>B</strong></td></tr></table>';
        const result = promoteBoldHeaderRows(html);
        assert.ok(result.includes('<table><tr><th><strong>A</strong></th></tr></table>'));
        assert.ok(result.includes('<table><tr><th><strong>B</strong></th></tr></table>'));
    });

    it('passes through non-table html unchanged', () => {
        const html = '<div><strong>no table</strong></div>';
        assert.strictEqual(promoteBoldHeaderRows(html), html);
    });

    it('passes through empty and non-string input unchanged', () => {
        assert.strictEqual(promoteBoldHeaderRows(''), '');
        assert.strictEqual(promoteBoldHeaderRows(null), null);
        assert.strictEqual(promoteBoldHeaderRows(undefined), undefined);
    });

    it('handles span-wrapped cells by skipping promotion (bold-only requirement)', () => {
        const html = '<table><tr><td><span class="caps">TOTP</span></td></tr></table>';
        assert.strictEqual(promoteBoldHeaderRows(html), html);
    });
});

describe('normalizeTableHtml (composed)', () => {
    it('collapses whitespace then promotes bold header for the user-reported Redmine case', () => {
        const html = '<table>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td><strong>Component</strong></td>\n\t\t\t<td><strong>Lifetime</strong></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Login session</td>\n\t\t\t<td>Normal</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td><span class="caps">TOTP</span> secret</td>\n\t\t\t<td>Until reset</td>\n\t\t</tr>\n\t</tbody>\n</table>';
        const result = normalizeTableHtml(html);
        assert.ok(result.includes('<tr><th><strong>Component</strong></th><th><strong>Lifetime</strong></th></tr>'), 'first row promoted to th');
        assert.ok(!result.includes('\n\t'), 'whitespace collapsed');
        assert.ok(result.includes('<td>Login session</td><td>Normal</td>'), 'data row preserved');
        assert.ok(result.includes('<td><span class="caps">TOTP</span> secret</td><td>Until reset</td>'), 'capped abbreviation row preserved');
    });

    it('is idempotent on already-normalized tables', () => {
        const html = '<table><tr><th><strong>H</strong></th></tr><tr><td>x</td></tr></table>';
        assert.strictEqual(normalizeTableHtml(html), html);
    });

    it('preserves pre/code outside tables', () => {
        const html = '<pre>\n  code\n</pre>\n<table><tr><td><strong>H</strong></td></tr></table>';
        const result = normalizeTableHtml(html);
        assert.ok(result.startsWith('<pre>\n  code\n</pre>'), 'pre content preserved');
        assert.ok(result.includes('<tr><th><strong>H</strong></th></tr>'), 'bold header promoted');
    });
});