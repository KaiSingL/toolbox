const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { extractLanguage, formatFencedCode } = require('./code-block.js');

describe('extractLanguage', () => {
    it('extracts language from language-XXX class', () => {
        assert.strictEqual(extractLanguage('language-java'), 'java');
        assert.strictEqual(extractLanguage('language-python'), 'python');
    });

    it('extracts language from lang-XXX class', () => {
        assert.strictEqual(extractLanguage('lang-ruby'), 'ruby');
    });

    it('extracts bare class token', () => {
        assert.strictEqual(extractLanguage('java'), 'java');
        assert.strictEqual(extractLanguage('js'), 'js');
    });

    it('treats text class as no language', () => {
        assert.strictEqual(extractLanguage('text'), '');
    });

    it('returns empty for empty or whitespace-only class', () => {
        assert.strictEqual(extractLanguage(''), '');
        assert.strictEqual(extractLanguage('   '), '');
    });

    it('returns empty for missing class (null/undefined)', () => {
        assert.strictEqual(extractLanguage(null), '');
        assert.strictEqual(extractLanguage(undefined), '');
    });

    it('prefers language- prefix over bare tokens', () => {
        assert.strictEqual(extractLanguage('highlight language-ruby'), 'ruby');
    });

    it('takes first bare token when multiple classes present', () => {
        assert.strictEqual(extractLanguage('foo bar'), 'foo');
    });

    it('trims surrounding whitespace', () => {
        assert.strictEqual(extractLanguage('  java  '), 'java');
    });
});

describe('formatFencedCode', () => {
    it('formats a fenced block with a language', () => {
        assert.strictEqual(
            formatFencedCode('java', 'System.out.println("hi");', '```'),
            '```java\nSystem.out.println("hi");\n```'
        );
    });

    it('recognises language-XXX classes', () => {
        assert.strictEqual(
            formatFencedCode('language-python', 'print(1)', '```'),
            '```python\nprint(1)\n```'
        );
    });

    it('emits a bare fence for the text class', () => {
        assert.strictEqual(formatFencedCode('text', 'plain code', '```'), '```\nplain code\n```');
    });

    it('emits a bare fence when no class is given', () => {
        assert.strictEqual(formatFencedCode('', 'plain code', '```'), '```\nplain code\n```');
    });

    it('trims leading and trailing newlines from the code', () => {
        assert.strictEqual(formatFencedCode('java', '\ncode\n', '```'), '```java\ncode\n```');
        assert.strictEqual(formatFencedCode('java', '\n\n\ncode\n\n', '```'), '```java\ncode\n```');
    });

    it('preserves internal blank lines', () => {
        assert.strictEqual(formatFencedCode('js', 'a\n\nb', '```'), '```js\na\n\nb\n```');
    });

    it('defaults to ``` fence when none is provided', () => {
        assert.strictEqual(formatFencedCode('java', 'code'), '```java\ncode\n```');
    });

    it('supports a custom fence', () => {
        assert.strictEqual(formatFencedCode('java', 'code', '~~~~'), '~~~~java\ncode\n~~~~');
    });

    it('handles null textContent as empty code', () => {
        assert.strictEqual(formatFencedCode('java', null, '```'), '```java\n\n```');
    });

    it('round-trips the Redmine output back to a fenced block', () => {
        const classAttr = 'java';
        const textContent = '\nSystem.out.println("hi");\n';
        assert.strictEqual(
            formatFencedCode(classAttr, textContent, '```'),
            '```java\nSystem.out.println("hi");\n```'
        );
    });
});
