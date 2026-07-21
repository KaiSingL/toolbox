// State Management
const inputEl = document.getElementById('input');
const toTextileBtn = document.getElementById('to-textile');
const toMarkdownBtn = document.getElementById('to-markdown');
const copyBtn = document.getElementById('copy-btn');
const errorEl = document.getElementById('error');

const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
});

turndown.use(turndownPluginGfm.gfm);

turndown.addRule('fencedCodeBlock', {
    filter: function (node, options) {
        return options.codeBlockStyle === 'fenced' &&
            node.nodeName === 'PRE' &&
            node.firstChild &&
            node.firstChild.nodeName === 'CODE';
    },
    replacement: function (content, node, options) {
        const codeEl = node.firstChild;
        const fenceBlock = formatFencedCode(codeEl.getAttribute('class') || '', codeEl.textContent, options.fence);
        return '\n\n' + fenceBlock + '\n\n';
    }
});

function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function clearError() {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
}

// Conversion: Markdown -> Textile (offline, vendored library)
function convertToTextile() {
    clearError();
    const source = inputEl.value;
    if (!source.trim()) {
        showError('Nothing to convert. Paste some markup first.');
        return;
    }
    try {
        const result = new MarkdownToTextile().convert(source);
        inputEl.value = result;
        inputEl.focus();
    } catch (err) {
        showError('Failed to convert to Textile: ' + err.message);
    }
}

// Conversion: Textile -> Markdown (textile-js -> turndown)
function convertToMarkdown() {
    clearError();
    const source = inputEl.value;
    if (!source.trim()) {
        showError('Nothing to convert. Paste some markup first.');
        return;
    }
    try {
        const html = normalizeTableHtml(textile(source));
        const result = turndown.turndown(html);
        inputEl.value = result;
        inputEl.focus();
    } catch (err) {
        showError('Failed to convert to Markdown: ' + err.message);
    }
}

async function copyOutput() {
    const text = inputEl.value;
    if (!text) {
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = original;
        }, 1500);
    } catch (err) {
        showError('Could not copy to clipboard: ' + err.message);
    }
}

// Event Listeners
toTextileBtn.addEventListener('click', convertToTextile);
toMarkdownBtn.addEventListener('click', convertToMarkdown);
copyBtn.addEventListener('click', copyOutput);

inputEl.addEventListener('input', clearError);
