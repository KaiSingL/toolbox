const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const MarkdownToTextile = require('./markdown-to-textile.js');

describe('MarkdownToTextile', () => {
    let converter;

    beforeEach(() => {
        converter = new MarkdownToTextile();
    });

    describe('headers', () => {
        it('converts h1 through h6', () => {
            assert.strictEqual(converter.convert('# H1'), 'h1. H1\n');
            assert.strictEqual(converter.convert('## H2'), 'h2. H2\n');
            assert.strictEqual(converter.convert('### H3'), 'h3. H3\n');
            assert.strictEqual(converter.convert('#### H4'), 'h4. H4\n');
            assert.strictEqual(converter.convert('##### H5'), 'h5. H5\n');
            assert.strictEqual(converter.convert('###### H6'), 'h6. H6\n');
        });
    });

    describe('emphasis', () => {
        it('converts bold (** and __)', () => {
            assert.strictEqual(converter.convert('**bold**'), '*bold*');
            assert.strictEqual(converter.convert('__bold__'), '*bold*');
        });

        it('converts italic (* and _)', () => {
            assert.strictEqual(converter.convert('*italic*'), '_italic_');
            assert.strictEqual(converter.convert('_italic_'), '_italic_');
        });

        it('handles bold and italic in the same input', () => {
            assert.strictEqual(converter.convert('**bold** and *italic*'), '*bold* and _italic_');
        });

        it('converts strikethrough', () => {
            assert.strictEqual(converter.convert('~~deleted~~'), '-deleted-');
        });
    });

    describe('lists', () => {
        it('converts unordered lists', () => {
            assert.strictEqual(converter.convert('- item'), '* item');
            assert.strictEqual(converter.convert('* item'), '* item');
        });

        it('converts ordered lists', () => {
            assert.strictEqual(converter.convert('1. item'), '# item');
        });

        it('handles nested unordered lists by indentation', () => {
            const input = '- top\n  - nested';
            const result = converter.convert(input);
            assert.strictEqual(result, '* top\n** nested');
        });
    });

    describe('task lists', () => {
        it('converts checked task to green marker', () => {
            assert.strictEqual(converter.convert('- [x] done'), '* {color:green}(/){color} done');
        });

        it('converts checked task case-insensitively', () => {
            assert.strictEqual(converter.convert('- [X] done'), '* {color:green}(/){color} done');
        });

        it('converts unchecked task to red marker', () => {
            assert.strictEqual(converter.convert('- [ ] todo'), '* {color:red}(x){color} todo');
        });
    });

    describe('links and images', () => {
        it('converts links', () => {
            assert.strictEqual(converter.convert('[text](https://example.com)'), '"text":https://example.com');
        });

        it('converts images', () => {
            assert.strictEqual(converter.convert('![alt](https://example.com/img.png)'), '!https://example.com/img.png(alt)!');
        });

        it('does not treat an image as a link', () => {
            const result = converter.convert('![alt](url)');
            assert.strictEqual(result, '!url(alt)!');
            assert.ok(!result.includes('"alt"'));
        });
    });

    describe('code', () => {
        it('converts inline code', () => {
            assert.strictEqual(converter.convert('use `code` here'), 'use @code@ here');
        });

        it('converts fenced code block without language', () => {
            const input = '```\nplain code\n```';
            assert.strictEqual(converter.convert(input), 'bc. plain code\n');
        });

        it('converts fenced code block with language', () => {
            const input = '```js\nconsole.log(1)\n```';
            assert.strictEqual(converter.convert(input), 'bc(js). console.log(1)\n');
        });
    });

    describe('blockquotes', () => {
        it('converts single blockquote', () => {
            assert.strictEqual(converter.convert('> quote'), 'bq. quote');
        });

        it('converts nested blockquotes by arrow count', () => {
            assert.strictEqual(converter.convert('>> deep quote'), 'bq(2). deep quote');
            assert.strictEqual(converter.convert('>>> deeper quote'), 'bq(3). deeper quote');
        });
    });

    describe('footnotes', () => {
        it('converts footnote definitions', () => {
            assert.strictEqual(converter.convert('[^1]: A note'), 'fn1. A note');
        });

        it('converts footnote references', () => {
            assert.strictEqual(converter.convert('See [^1]'), 'See [1]');
        });
    });

    describe('definition lists', () => {
        it('converts a term with definition', () => {
            assert.strictEqual(converter.convert('term\n: definition'), '- term := definition');
        });
    });

    describe('horizontal rule', () => {
        it('passes through horizontal rule', () => {
            assert.strictEqual(converter.convert('---'), '---');
        });
    });

    describe('tables', () => {
        it('converts a simple table with left alignment', () => {
            const input = '| h1 | h2 |\n|----|----|\n| a  | b  |';
            const expected = '|_. h1|_. h2|\n|a|b|';
            assert.strictEqual(converter.convert(input), expected);
        });

        it('parses center and right alignment from separator', () => {
            const input = '| h1 | h2 | h3 |\n|:---|:--:|---:|\n| a  | b  | c  |';
            const result = converter.convert(input);
            assert.strictEqual(result, '|_. h1|=. h2|>. h3|\n|a|=. b|>. c|');
        });
    });

    describe('combined documents', () => {
        it('converts a document mixing several features', () => {
            const input = '# Title\n\n**bold** and *italic*\n\n- item one\n- item two';
            const result = converter.convert(input);
            assert.ok(result.includes('h1. Title'));
            assert.ok(result.includes('*bold* and _italic_'));
            assert.ok(result.includes('* item one'));
            assert.ok(result.includes('* item two'));
        });
    });

    describe('input validation', () => {
        it('returns empty string for empty input', () => {
            assert.strictEqual(converter.convert(''), '');
        });

        it('throws on non-string input', () => {
            assert.throws(() => converter.convert(123), /Input must be a string/);
            assert.throws(() => converter.convert(null), /Input must be a string/);
            assert.throws(() => converter.convert(undefined), /Input must be a string/);
        });

        it('throws when input exceeds MAX_INPUT_LENGTH', () => {
            const tooLong = 'x'.repeat(MarkdownToTextile.MAX_INPUT_LENGTH + 1);
            assert.throws(() => converter.convert(tooLong), /Input exceeds maximum length/);
        });

        it('accepts input at exactly MAX_INPUT_LENGTH', () => {
            const atLimit = 'x'.repeat(MarkdownToTextile.MAX_INPUT_LENGTH);
            assert.doesNotThrow(() => converter.convert(atLimit));
        });

        it('leaves plain text without markdown unchanged', () => {
            assert.strictEqual(converter.convert('just plain text'), 'just plain text');
        });
    });
});
