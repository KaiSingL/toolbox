/**
 * Markdown to Textile converter
 */
class MarkdownToTextile {
  constructor() {
    this.rules = [
      // Headers
      { pattern: /^# (.+)$/gm, replacement: 'h1. $1\n\n' },
      { pattern: /^## (.+)$/gm, replacement: 'h2. $1\n\n' },
      { pattern: /^### (.+)$/gm, replacement: 'h3. $1\n\n' },
      { pattern: /^#### (.+)$/gm, replacement: 'h4. $1\n\n' },
      { pattern: /^##### (.+)$/gm, replacement: 'h5. $1\n\n' },
      { pattern: /^###### (.+)$/gm, replacement: 'h6. $1\n\n' },
      
      // Emphasis (bold uses placeholder \x00 to prevent italic re-matching)
      { pattern: /\*\*([^*]+)\*\*/g, replacement: '\x00$1\x00' },  // Bold -> placeholder
      { pattern: /__([^_]+)__/g, replacement: '\x00$1\x00' },      // Bold (alternate) -> placeholder
      { pattern: /(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, replacement: '_$1_' },  // Italic
      { pattern: /(?<!_)_(?!_)([^_]+?)(?<!_)_(?!_)/g, replacement: '_$1_' },        // Italic (alternate)
      { pattern: /\x00([^\x00]+)\x00/g, replacement: '*$1*' },     // Placeholder -> Textile bold

      // Task lists (must come before general lists)
      { pattern: /^([ \t]*)[-*] \[x\] (.+)$/gmi, replacement: (match, indent, text) => {
        const level = Math.floor(indent.length / 2) + 1;
        return '*'.repeat(level) + ' {color:green}(/){color} ' + text;
      }},
      { pattern: /^([ \t]*)[-*] \[ \] (.+)$/gm, replacement: (match, indent, text) => {
        const level = Math.floor(indent.length / 2) + 1;
        return '*'.repeat(level) + ' {color:red}(x){color} ' + text;
      }},

      // Lists (nested + flat)
      { pattern: /^([ \t]*)[-*] (.+)$/gm, replacement: (match, indent, text) => {
        const level = Math.floor(indent.length / 2) + 1;
        return '*'.repeat(level) + ' ' + text;
      }},
      { pattern: /^([ \t]*)(\d+)[.)] (.+)$/gm, replacement: (match, indent, num, text) => {
        const level = Math.floor(indent.length / 2) + 1;
        return '#'.repeat(level) + ' ' + text;
      }},

      // Images (must come before links so ![alt](url) is not matched as link)
      { pattern: /!\[([^\]]*)\]\(([^)]+)\)/g, replacement: '!$2($1)!' },

      // Links
      { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '"$1":$2' },
      
      // Code blocks (must come before inline code)
      { pattern: /```(\w+)?\n([\s\S]+?)\n```/gm, replacement: function(match, lang, code) {
        const langClass = lang || 'text';
        const trimmed = code.replace(/^\n+|\n+$/g, '');
        return `<pre><code class="${langClass}">\n${trimmed}\n</code></pre>\n`;
      }},

      // Inline code
      { pattern: /`([^`]+)`/g, replacement: '@$1@' },
      
      // Blockquotes: pass > markers through as-is (RedCloth3 handles > natively).
      // Collapse empty continuation lines (> with no content) so consecutive
      // > lines stay grouped as one composite blockquote in RedCloth3.
      { pattern: /^>+\s*\n/gm, replacement: '' },

      // Footnotes
      { pattern: /\[\^(\d+)\]:\s*(.+)$/gm, replacement: 'fn$1. $2' },
      { pattern: /\[\^(\d+)\]/g, replacement: '[$1]' },

      // Definition lists
      { pattern: /^([^\n]+)\n: (.+)$/gm, replacement: '- $1 := $2' },

      // Horizontal rule
      { pattern: /^([-*_])\1{2,}$/gm, replacement: '----' },

      // Strikethrough
      { pattern: /~~(.+?)~~/g, replacement: '-$1-' },
      
      // Tables - match consecutive lines starting and ending with |
      { pattern: /(?:^\|.+\|$\n?)+/gm, replacement: (match) => this.convertTable(match) },
    ];
  }
  
  /**
   * Convert markdown table to textile format
   * @param {string} markdownTable - The markdown table text
   * @return {string} - The converted textile table
   */
  convertTable(markdownTable) {
    const lines = markdownTable.trim().split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      // Not a proper table, return as-is
      return markdownTable;
    }
    
    const headerRow = lines[0];
    let dataStartIndex = 1;
    let alignments = [];
    
    // Check if second line is a separator (e.g. |------|:----:|-----:|)
    if (lines[1] && /^\|[\s\-\:\|]+\|$/.test(lines[1])) {
      const separatorRow = lines[1];
      dataStartIndex = 2;
      
      // Parse alignment from separator
      alignments = separatorRow.split('|').slice(1, -1).map(sep => {
        const trimmed = sep.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
        if (trimmed.endsWith(':')) return 'right';
        return 'left'; // default
      });
    }
    
    const dataRows = lines.slice(dataStartIndex);
    
    // Parse header
    const headers = headerRow.split('|').slice(1, -1).map(h => h.trim());
    
    // If no alignments parsed, default to left
    if (alignments.length === 0) {
      alignments = headers.map(() => 'left');
    }
    
    let result = '';
    
    // Header row with textile formatting
    result += '|' + headers.map((header, i) => {
      const align = alignments[i] || 'left';
      if (align === 'center') return `_=. ${header}`;
      if (align === 'right') return `_>. ${header}`;
      return `_. ${header}`;
    }).join('|') + '|\n';
    
    // Data rows
    dataRows.forEach(row => {
      if (row.trim()) {
        const cells = row.split('|').slice(1, -1).map(c => this.normalizeTableCell(c.trim()));
        result += '|' + cells.map((cell, i) => {
          const align = alignments[i] || 'left';
          if (align === 'center') return `=. ${cell}`;
          if (align === 'right') return `>. ${cell}`;
          return cell; // left-aligned (default)
        }).join('|') + '|\n';
      }
    });
    
    return result.trim() + '\n\n';
  }

  /**
   * Apply inline conversions that table cells need but the line-anchored
   * rules miss (task markers, etc.). Runs on already-trimmed cell text.
   * @param {string} cell - The trimmed cell content.
   * @return {string} - The normalized cell content.
   */
  normalizeTableCell(cell) {
    return cell
      .replace(/\[x\]\s+/g, '{color:green}(/){color} ')
      .replace(/\[ \]\s+/g, '{color:red}(x){color} ');
  }
  
  /**
   * Maximum input length to prevent ReDoS / excessive processing
   */
  static MAX_INPUT_LENGTH = 500000;

  /**
   * Convert Markdown text to Textile
   * @param {string} markdownText - The markdown text to convert
   * @return {string} - The converted textile text
   * @throws {Error} If input is not a string or exceeds size limit
   */
  convert(markdownText) {
    if (typeof markdownText !== 'string') {
      throw new Error('Input must be a string');
    }

    if (markdownText.length > MarkdownToTextile.MAX_INPUT_LENGTH) {
      throw new Error(`Input exceeds maximum length of ${MarkdownToTextile.MAX_INPUT_LENGTH} characters`);
    }

    let textileText = markdownText.replace(/\r\n|\r/g, '\n');

    // Apply each conversion rule
    this.rules.forEach(rule => {
      textileText = textileText.replace(rule.pattern, rule.replacement);
    });

    // Collapse 3+ consecutive newlines to 2 (bounds between blocks).
    textileText = textileText.replace(/\n{3,}/g, '\n\n');

    return textileText;
  }
}

// If running in a browser environment, attach to window
if (typeof window !== 'undefined') {
  window.MarkdownToTextile = MarkdownToTextile;
}

// If in Node.js environment, export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownToTextile;
}
