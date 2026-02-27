import { Decoration, WidgetType, EditorView } from '@codemirror/view';
import { StateField } from '@codemirror/state';
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
            
            row.forEach(cell => {
                const td = document.createElement('td');
                td.className = rowIndex === 0 ? 'cm-md-table-cell cm-md-table-header' : 'cm-md-table-cell';
                td.textContent = cell;
                tr.appendChild(td);
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

export function buildWidgets(state) {
    if (state.field(renderModeField) === 'raw') {
        return Decoration.none;
    }
    
    const widgets = [];
    const doc = state.doc;
    const text = doc.toString();
    const lines = text.split('\n');
    
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockStart = 0;
    let codeBlockContent = '';
    
    let inMathBlock = false;
    let mathBlockStart = 0;
    let mathBlockContent = '';
    
    let inMermaidBlock = false;
    let mermaidBlockStart = 0;
    let mermaidBlockContent = '';
    
    let inTable = false;
    let tableStart = 0;
    let tableRows = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStart = doc.line(i + 1).from;
        const lineEnd = doc.line(i + 1).to;
        
        if (inMermaidBlock) {
            if (line.trim() === '```') {
                const widget = Decoration.widget({
                    widget: new MermaidWidget(mermaidBlockContent.trim()),
                    side: 1,
                    block: true
                });
                widgets.push(widget.range(lineStart));
                
                inMermaidBlock = false;
                mermaidBlockContent = '';
            } else {
                mermaidBlockContent += line + '\n';
            }
            continue;
        }
        
        if (inCodeBlock) {
            if (line.trim() === '```') {
                const widget = Decoration.widget({
                    widget: new CodeBlockWidget(codeBlockContent.trimEnd(), codeBlockLang),
                    side: 1,
                    block: true
                });
                widgets.push(widget.range(codeBlockStart));
                
                inCodeBlock = false;
                codeBlockContent = '';
            } else {
                codeBlockContent += line + '\n';
            }
            continue;
        }
        
        if (inMathBlock) {
            if (line.trim() === '$$') {
                const widget = Decoration.widget({
                    widget: new KatexWidget(mathBlockContent.trim(), true),
                    side: 1,
                    block: true
                });
                widgets.push(widget.range(mathBlockStart));
                
                inMathBlock = false;
                mathBlockContent = '';
            } else {
                mathBlockContent += line + '\n';
            }
            continue;
        }
        
        if (line.trim() === '```mermaid') {
            inMermaidBlock = true;
            mermaidBlockStart = lineStart;
            mermaidBlockContent = '';
            continue;
        }
        
        const codeMatch = line.match(/^```(\w*)$/);
        if (codeMatch) {
            inCodeBlock = true;
            codeBlockLang = codeMatch[1] || 'text';
            codeBlockStart = lineStart;
            codeBlockContent = '';
            continue;
        }
        
        if (line.trim() === '$$') {
            inMathBlock = true;
            mathBlockStart = lineStart;
            mathBlockContent = '';
            continue;
        }
        
        if (/^[-]{3,}$|^[*]{3,}$|^[_]{3,}$/.test(line.trim()) && line.trim().length >= 3) {
            const widget = Decoration.widget({
                widget: new HorizontalRuleWidget(),
                side: 1,
                block: true
            });
            widgets.push(widget.range(lineStart));
            continue;
        }
        
        const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch && !line.includes('`')) {
            const idx = line.indexOf(imageMatch[0]);
            if (idx !== -1) {
                const pos = lineStart + idx;
                const widget = Decoration.widget({
                    widget: new ImageWidget(imageMatch[2], imageMatch[1]),
                    side: 1
                });
                widgets.push(widget.range(pos));
            }
        }
        
        const emojiRegex = /:([a-z0-9_+-]+):/gi;
        let emojiMatch;
        while ((emojiMatch = emojiRegex.exec(line)) !== null) {
            const emoji = getEmoji(emojiMatch[1]);
            if (emoji) {
                const pos = lineStart + emojiMatch.index;
                const widget = Decoration.widget({
                    widget: new EmojiWidget(emoji),
                    side: 0
                });
                widgets.push(widget.range(pos));
            }
        }
        
        const inlineMathRegex = /\$([^\$\n]+)\$/g;
        let mathMatch;
        while ((mathMatch = inlineMathRegex.exec(line)) !== null) {
            const pos = lineStart + mathMatch.index;
            const widget = Decoration.widget({
                widget: new KatexWidget(mathMatch[1], false),
                side: 0
            });
            widgets.push(widget.range(pos));
        }
        
        const taskMatch = line.match(/^(\s*)- \[([ x])\]/);
        if (taskMatch) {
            const checked = taskMatch[2] === 'x';
            const idx = line.indexOf('- [');
            if (idx !== -1) {
                const pos = lineStart + idx;
                const widget = Decoration.widget({
                    widget: new CheckboxWidget(checked, lineStart),
                    side: 0
                });
                widgets.push(widget.range(pos));
            }
        }
    }
    
    return Decoration.set(widgets, true);
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
