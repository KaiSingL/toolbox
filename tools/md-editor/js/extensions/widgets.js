import { Decoration, WidgetType, EditorView } from '@codemirror/view';
import { StateField, RangeSetBuilder } from '@codemirror/state';
import { getEmoji, parseMermaidBlock } from '../utils/markdown-parser.js';
import { renderModeField, setRenderMode } from './decorations.js';

let mermaidInitialized = false;
let mermaidIdCounter = 0;

function initMermaid() {
    if (mermaidInitialized || typeof mermaid === 'undefined') return;
    
    mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true
        },
        sequence: {
            useMaxWidth: true
        },
        gantt: {
            useMaxWidth: true
        }
    });
    
    mermaidInitialized = true;
}

class MermaidWidget extends WidgetType {
    constructor(code) {
        super();
        this.code = code;
        this.id = `mermaid-${++mermaidIdCounter}`;
    }
    
    toDOM() {
        const wrapper = document.createElement('div');
        wrapper.className = 'cm-md-mermaid';
        wrapper.setAttribute('data-mermaid-id', this.id);
        
        if (typeof mermaid !== 'undefined') {
            initMermaid();
            
            mermaid.render(this.id, this.code).then(({ svg }) => {
                wrapper.innerHTML = svg;
            }).catch(err => {
                wrapper.innerHTML = `<span style="color: #ff4444;">Mermaid Error: ${err.message || 'Invalid syntax'}</span>`;
            });
        } else {
            wrapper.innerHTML = '<span style="color: #888;">Mermaid not loaded</span>';
        }
        
        return wrapper;
    }
    
    eq(other) {
        return other instanceof MermaidWidget && other.code === this.code;
    }
}

class KatexWidget extends WidgetType {
    constructor(latex, displayMode = false) {
        super();
        this.latex = latex;
        this.displayMode = displayMode;
    }
    
    toDOM() {
        const span = document.createElement('span');
        span.className = this.displayMode ? 'cm-md-math cm-md-math-block' : 'cm-md-math';
        
        if (typeof katex !== 'undefined') {
            try {
                katex.render(this.latex, span, {
                    displayMode: this.displayMode,
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                span.textContent = this.latex;
                span.style.color = '#ff4444';
            }
        } else {
            span.textContent = this.latex;
        }
        
        return span;
    }
    
    eq(other) {
        return other instanceof KatexWidget && 
               other.latex === this.latex && 
               other.displayMode === this.displayMode;
    }
}

class EmojiWidget extends WidgetType {
    constructor(emoji) {
        super();
        this.emoji = emoji;
    }
    
    toDOM() {
        const span = document.createElement('span');
        span.className = 'cm-md-emoji';
        span.textContent = this.emoji;
        return span;
    }
    
    eq(other) {
        return other instanceof EmojiWidget && other.emoji === this.emoji;
    }
}

class ImageWidget extends WidgetType {
    constructor(url, alt) {
        super();
        this.url = url;
        this.alt = alt;
    }
    
    toDOM() {
        const img = document.createElement('img');
        img.className = 'cm-md-image';
        img.src = this.url;
        img.alt = this.alt;
        img.loading = 'lazy';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        img.onerror = () => {
            img.style.display = 'none';
            const error = document.createElement('span');
            error.style.color = '#ff4444';
            error.textContent = `[Image not found: ${this.url}]`;
            img.parentNode?.insertBefore(error, img);
        };
        
        return img;
    }
    
    eq(other) {
        return other instanceof ImageWidget && 
               other.url === this.url && 
               other.alt === this.alt;
    }
}

class CheckboxWidget extends WidgetType {
    constructor(checked, lineStart) {
        super();
        this.checked = checked;
        this.lineStart = lineStart;
    }
    
    toDOM() {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'cm-md-checkbox';
        checkbox.checked = this.checked;
        checkbox.style.pointerEvents = 'auto';
        checkbox.style.cursor = 'pointer';
        
        return checkbox;
    }
    
    eq(other) {
        return other instanceof CheckboxWidget && 
               other.checked === this.checked;
    }
}

class HorizontalRuleWidget extends WidgetType {
    constructor() {
        super();
    }
    
    toDOM() {
        const hr = document.createElement('hr');
        hr.className = 'cm-md-hr';
        return hr;
    }
    
    eq(other) {
        return other instanceof HorizontalRuleWidget;
    }
}

class CodeBlockWidget extends WidgetType {
    constructor(code, lang) {
        super();
        this.code = code;
        this.lang = lang;
    }
    
    toDOM() {
        const wrapper = document.createElement('div');
        wrapper.className = 'cm-md-codeblock';
        
        const pre = document.createElement('pre');
        const codeEl = document.createElement('code');
        codeEl.textContent = this.code;
        
        if (this.lang && typeof hljs !== 'undefined') {
            codeEl.className = `language-${this.lang}`;
            try {
                hljs.highlightElement(codeEl);
            } catch (e) {
                console.warn('Highlight.js error:', e);
            }
        }
        
        pre.appendChild(codeEl);
        wrapper.appendChild(pre);
        
        return wrapper;
    }
    
    eq(other) {
        return other instanceof CodeBlockWidget && 
               other.code === this.code && 
               other.lang === this.lang;
    }
}

class TableWidget extends WidgetType {
    constructor(rows) {
        super();
        this.rows = rows;
    }
    
    toDOM() {
        const table = document.createElement('table');
        table.className = 'cm-md-table';
        
        this.rows.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            tr.className = 'cm-md-table-row';
            
            row.forEach((cell, cellIndex) => {
                const cellEl = rowIndex === 0 ? document.createElement('th') : document.createElement('td');
                cellEl.className = rowIndex === 0 ? 'cm-md-table-cell cm-md-table-header' : 'cm-md-table-cell';
                cellEl.textContent = cell;
                tr.appendChild(cellEl);
            });
            
            table.appendChild(tr);
        });
        
        return table;
    }
    
    eq(other) {
        return other instanceof TableWidget && 
               JSON.stringify(other.rows) === JSON.stringify(this.rows);
    }
}

function parseTableRow(line) {
    const cells = [];
    let current = '';
    let inCode = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '`') {
            inCode = !inCode;
            current += char;
        } else if (char === '|' && !inCode) {
            cells.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    if (current.trim()) {
        cells.push(current.trim());
    }
    
    return cells.filter(cell => cell !== '');
}

function isTableSeparator(line) {
    return /^\|?[\s]*:?-+:?[\s]*\|/.test(line) || /^[\s]*:?-+:?[\s]*\|/.test(line);
}

export function buildWidgets(state) {
    if (state.field(renderModeField) === 'raw') {
        return Decoration.none;
    }
    
    const builder = new RangeSetBuilder();
    const doc = state.doc;
    const text = doc.toString();
    const lines = text.split('\n');
    
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockStart = 0;
    let codeBlockEnd = 0;
    let codeBlockContent = '';
    
    let inMathBlock = false;
    let mathBlockStart = 0;
    let mathBlockEnd = 0;
    let mathBlockContent = '';
    
    let inMermaidBlock = false;
    let mermaidBlockStart = 0;
    let mermaidBlockEnd = 0;
    let mermaidBlockContent = '';
    
    let inTable = false;
    let tableStart = 0;
    let tableEnd = 0;
    let tableRows = [];
    
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const lineStart = doc.line(i + 1).from;
        const lineEnd = doc.line(i + 1).to;
        
        if (inMermaidBlock) {
            if (line.trim() === '```') {
                mermaidBlockEnd = lineEnd;
                const widget = Decoration.replace({
                    widget: new MermaidWidget(mermaidBlockContent.trim()),
                    block: true
                });
                builder.add(mermaidBlockStart, mermaidBlockEnd, widget);
                
                inMermaidBlock = false;
                mermaidBlockContent = '';
            } else {
                mermaidBlockContent += line + '\n';
            }
            i++;
            continue;
        }
        
        if (inCodeBlock) {
            if (line.trim() === '```') {
                codeBlockEnd = lineEnd;
                const widget = Decoration.replace({
                    widget: new CodeBlockWidget(codeBlockContent.trimEnd(), codeBlockLang),
                    block: true
                });
                builder.add(codeBlockStart, codeBlockEnd, widget);
                
                inCodeBlock = false;
                codeBlockContent = '';
            } else {
                codeBlockContent += line + '\n';
            }
            i++;
            continue;
        }
        
        if (inMathBlock) {
            if (line.trim() === '$$') {
                mathBlockEnd = lineEnd;
                const widget = Decoration.replace({
                    widget: new KatexWidget(mathBlockContent.trim(), true),
                    block: true
                });
                builder.add(mathBlockStart, mathBlockEnd, widget);
                
                inMathBlock = false;
                mathBlockContent = '';
            } else {
                mathBlockContent += line + '\n';
            }
            i++;
            continue;
        }
        
        if (inTable) {
            if (line.trim() === '' || !line.includes('|')) {
                tableEnd = doc.line(i).from;
                if (tableRows.length > 0) {
                    const widget = Decoration.replace({
                        widget: new TableWidget(tableRows),
                        block: true
                    });
                    builder.add(tableStart, tableEnd, widget);
                }
                inTable = false;
                tableRows = [];
                continue;
            } else if (isTableSeparator(line)) {
                i++;
                continue;
            } else {
                const cells = parseTableRow(line);
                if (cells.length > 0) {
                    tableRows.push(cells);
                }
                tableEnd = lineEnd;
            }
            i++;
            continue;
        }
        
        if (line.trim() === '```mermaid') {
            inMermaidBlock = true;
            mermaidBlockStart = lineStart;
            mermaidBlockEnd = lineEnd;
            mermaidBlockContent = '';
            i++;
            continue;
        }
        
        const codeMatch = line.match(/^```(\w*)$/);
        if (codeMatch) {
            inCodeBlock = true;
            codeBlockLang = codeMatch[1] || 'text';
            codeBlockStart = lineStart;
            codeBlockEnd = lineEnd;
            codeBlockContent = '';
            i++;
            continue;
        }
        
        if (line.trim() === '$$') {
            inMathBlock = true;
            mathBlockStart = lineStart;
            mathBlockEnd = lineEnd;
            mathBlockContent = '';
            i++;
            continue;
        }
        
        if (/^[-]{3,}$|^[*]{3,}$|^[_]{3,}$/.test(line.trim()) && line.trim().length >= 3) {
            const widget = Decoration.replace({
                widget: new HorizontalRuleWidget(),
                block: true
            });
            builder.add(lineStart, lineEnd, widget);
            i++;
            continue;
        }
        
        if (line.includes('|') && !line.includes('`|`') && !line.trim().startsWith('>')) {
            if (!isTableSeparator(line)) {
                const cells = parseTableRow(line);
                if (cells.length >= 2) {
                    inTable = true;
                    tableStart = lineStart;
                    tableEnd = lineEnd;
                    tableRows = [cells];
                    i++;
                    continue;
                }
            }
        }
        
        const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch && !line.includes('`')) {
            const idx = line.indexOf(imageMatch[0]);
            if (idx !== -1) {
                const pos = lineStart + idx;
                const endPos = pos + imageMatch[0].length;
                const widget = Decoration.replace({
                    widget: new ImageWidget(imageMatch[2], imageMatch[1])
                });
                builder.add(pos, endPos, widget);
            }
        }
        
        const emojiRegex = /:([a-z0-9_+-]+):/gi;
        let emojiMatch;
        while ((emojiMatch = emojiRegex.exec(line)) !== null) {
            const emoji = getEmoji(emojiMatch[1]);
            if (emoji) {
                const pos = lineStart + emojiMatch.index;
                const endPos = pos + emojiMatch[0].length;
                const widget = Decoration.replace({
                    widget: new EmojiWidget(emoji)
                });
                builder.add(pos, endPos, widget);
            }
        }
        
        const inlineMathRegex = /\$([^\$\n]+)\$/g;
        let mathMatch;
        while ((mathMatch = inlineMathRegex.exec(line)) !== null) {
            const pos = lineStart + mathMatch.index;
            const endPos = pos + mathMatch[0].length;
            const widget = Decoration.replace({
                widget: new KatexWidget(mathMatch[1], false)
            });
            builder.add(pos, endPos, widget);
        }
        
        const taskMatch = line.match(/^(\s*)- \[([ x])\]/);
        if (taskMatch) {
            const checked = taskMatch[2] === 'x';
            const idx = line.indexOf('- [');
            if (idx !== -1) {
                const pos = lineStart + idx;
                const endPos = pos + taskMatch[0].trim().length;
                const widget = Decoration.replace({
                    widget: new CheckboxWidget(checked, lineStart)
                });
                builder.add(pos, endPos, widget);
            }
        }
        
        i++;
    }
    
    if (inTable && tableRows.length > 0) {
        const widget = Decoration.replace({
            widget: new TableWidget(tableRows),
            block: true
        });
        builder.add(tableStart, doc.length, widget);
    }
    
    return builder.finish();
}

export const widgetExtension = () => {
    initMermaid();
    
    return StateField.define({
        create(state) {
            return buildWidgets(state);
        },
        update(decorations, tr) {
            if (tr.docChanged || tr.effects.some(e => e.is(setRenderMode))) {
                return buildWidgets(tr.state);
            }
            return decorations.map(tr.changes);
        },
        provide: f => EditorView.decorations.from(f)
    });
};
