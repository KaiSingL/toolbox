import { EditorView, lineNumbers, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, keymap, ViewPlugin } from '@codemirror/view';
import { EditorState, Compartment, StateEffect, RangeSetBuilder, EditorSelection, Prec, StateField } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language';
import { markdownTheme } from './extensions/theme.js';
import { decorationExtension, buildDecorations, setRenderMode, renderModeField } from './extensions/decorations.js';
import { widgetExtension, buildWidgets } from './extensions/widgets.js';
import { createKeymap } from './extensions/keymap.js';

const SAMPLE_CONTENT = `# Markdown Editor Demo

Welcome to the **WYSIWYG** markdown editor with *inline rendering*.

## Text Formatting

This editor supports **bold**, *italic*, and ~~strikethrough~~ text. You can also use \`inline code\` for code snippets.

## Links and Images

[Visit Example.com](https://example.com) - links are clickable.

## Lists

### Unordered Lists
- First item
- Second item
  - Nested item A
  - Nested item B
- Third item

### Ordered Lists
1. Step one
2. Step two
3. Step three

### Task Lists
- [ ] Task to complete
- [x] Completed task
- [ ] Another pending task

## Blockquote

> This is a blockquote.
> It can span multiple lines.
>
> And include *formatted* **text**.

## Horizontal Rule

Above the line.

---

Below the line.

## Code Blocks

\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`);
    return {
        message: \`Welcome, \${name}\`,
        timestamp: Date.now()
    };
}

// Call the function
greet('World');
\`\`\`

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Print first 10 Fibonacci numbers
for i in range(10):
    print(fibonacci(i))
\`\`\`

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Bold | Done | \`**text**\` |
| Italic | Done | \`*text*\` |
| Links | Done | \`[text](url)\` |
| Images | Done | \`![alt](url)\` |

## Math (LaTeX)

Inline math: The equation $E = mc^2$ changed physics.

Block math:

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

$$
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$

## Mermaid Diagrams

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    
    User->>Browser: Click button
    Browser->>Server: HTTP Request
    Server-->>Browser: JSON Response
    Browser-->>User: Display result
\`\`\`

## Emoji Support

:smile: :rocket: :fire: :sparkles: :thumbsup: :heart:

Common emojis: :check: :x: :warning: :bulb: :bug: :gear:

---

## Tips

- Use **Ctrl+B** for bold
- Use **Ctrl+I** for italic
- Use **Ctrl+S** to save
- Use **Ctrl+O** to open a file
- Use **Tab** to indent

Start editing to see the magic! ✨
`;

let editor = null;
let currentFileName = 'untitled.md';
let isModified = false;

function init() {
    const editorEl = document.getElementById('editor');
    if (!editorEl) {
        console.error('Editor element not found');
        return;
    }

    const fileOps = {
        save: handleSave,
        open: handleOpen,
        newFile: handleNew,
        toggleMode: toggleMode
    };

    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            isModified = true;
            updateStats(update.state);
        }
        if (update.selectionSet) {
            updateStats(update.state);
        }
    });

    const extensions = [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            indentWithTab
        ]),
        markdown({
            base: markdownLanguage,
            codeLanguages: languages
        }),
        markdownTheme,
        updateListener,
        renderModeField,
        decorationExtension,
        widgetExtension()
    ];

    const state = EditorState.create({
        doc: SAMPLE_CONTENT,
        extensions
    });

    editor = new EditorView({
        state,
        parent: editorEl
    });

    const customKeymap = createKeymap(editor, fileOps);
    editor.dispatch({
        effects: StateEffect.appendConfig.of(customKeymap)
    });

    setupEventListeners(fileOps);
    updateStats(state);

    injectCMTokenOverrides();

    editor.focus();
}

function injectCMTokenOverrides() {
    const style = document.createElement('style');
    style.id = 'cm-token-overrides-dynamic';
    style.textContent = `
.cm-content .ͼ5 { color: #888888 !important; }
.cm-content .ͼ7 { color: #cac8f4 !important; }
.cm-content .ͼ8 { color: #ffd700 !important; font-weight: normal !important; font-style: normal !important; }
.cm-content .ͼ9 { color: #4ec9b0 !important; font-style: normal !important; font-weight: normal !important; }
.cm-content .ͼa { color: #98c379 !important; text-decoration: none !important; }
.cm-content .ͼb { color: #ffa657 !important; }
.cm-content .ͼc { color: #6a9955 !important; font-style: normal !important; }
.cm-content .ͼe { color: #ffa657 !important; }
`;
    document.head.appendChild(style);
}

function toggleMode() {
    const currentMode = editor.state.field(renderModeField);
    const newMode = currentMode === 'rendered' ? 'raw' : 'rendered';
    
    const container = document.querySelector('.editor-container');
    const modeIndicator = document.getElementById('mode-indicator');
    const toggleBtn = document.getElementById('btn-toggle');
    
    if (newMode === 'raw') {
        container.classList.remove('mode-rendered');
        modeIndicator.textContent = 'Raw';
        toggleBtn.classList.remove('active');
    } else {
        container.classList.add('mode-rendered');
        modeIndicator.textContent = 'Rendered';
        toggleBtn.classList.add('active');
    }
    
    editor.dispatch({
        effects: setRenderMode.of(newMode)
    });
}

function updateStats(state) {
    const text = state.doc.toString();
    const lines = state.doc.lines;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    
    document.getElementById('stat-lines').textContent = `${lines} lines`;
    document.getElementById('stat-words').textContent = `${words} words`;
    document.getElementById('stat-chars').textContent = `${chars} characters`;
}

function setupEventListeners(fileOps) {
    document.getElementById('btn-new').addEventListener('click', handleNew);
    document.getElementById('btn-open').addEventListener('click', handleOpen);
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-toggle').addEventListener('click', toggleMode);
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
    document.getElementById('error-close').addEventListener('click', hideError);

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            handleNew();
        }
    });
}

function handleNew() {
    if (isModified) {
        if (!confirm('Discard unsaved changes?')) {
            return;
        }
    }

    editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: '' }
    });
    
    currentFileName = 'untitled.md';
    isModified = false;
    updateStats(editor.state);
    editor.focus();
}

function handleOpen() {
    document.getElementById('file-input').click();
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: content }
        });
        currentFileName = file.name;
        isModified = false;
        updateStats(editor.state);
        editor.focus();
    };
    reader.onerror = () => {
        showError('Failed to read file');
    };
    reader.readAsText(file);

    e.target.value = '';
}

function handleSave() {
    const text = editor.state.doc.toString();
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    isModified = false;
}

function showError(message) {
    const overlay = document.getElementById('error-overlay');
    const msgEl = document.getElementById('error-message');
    msgEl.textContent = message;
    overlay.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-overlay').classList.add('hidden');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
