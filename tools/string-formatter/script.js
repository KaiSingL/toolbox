// DOM elements
const inputText = document.getElementById('input-text');
const quoteCharInput = document.getElementById('quote-char');
const delimiterInput = document.getElementById('delimiter');
const wordsPerLineInput = document.getElementById('words-per-line');
const includeTrailingCheckbox = document.getElementById('include-trailing');
const ignoreBlankCheckbox = document.getElementById('ignore-blank');
const formatBtn = document.getElementById('format-btn');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const output = document.getElementById('output');
const outputSection = document.getElementById('output-section');
const error = document.getElementById('error');

// Store original copy button content
const originalCopyBtnHTML = copyBtn.innerHTML;

// Formatting function
function formatWordList(text, quoteChar = '"', delimiter = ', ', wordsPerLine = Infinity, includeTrailingDelimiter = false, ignoreBlankLines = true) {
    let lines = text.split(/\r?\n/);

    if (ignoreBlankLines) {
        lines = lines.map(line => line.trim()).filter(line => line.length > 0);
    } else {
        lines = lines.map(line => line.trim());
    }

    const quotedWords = lines.map(word => `${quoteChar}${word}${quoteChar}`);

    const groups = [];
    for (let i = 0; i < quotedWords.length; i += wordsPerLine) {
        const chunk = quotedWords.slice(i, i + wordsPerLine);
        if (chunk.length > 0) {
            let line = chunk.join(delimiter);
            if (includeTrailingDelimiter && i + chunk.length < quotedWords.length) {
                line += delimiter;
            }
            groups.push(line);
        }
    }

    return groups.join('\n');
}

// Event listeners
formatBtn.addEventListener('click', () => {
    const text = inputText.value;
    if (!text.trim()) {
        showError('Please enter some text to format.');
        return;
    }
    hideError();

    const quoteChar = quoteCharInput.value || '"';
    const delimiter = delimiterInput.value || ', ';
    const wordsPerLine = wordsPerLineInput.value ? parseInt(wordsPerLineInput.value) : Infinity;
    const includeTrailing = includeTrailingCheckbox.checked;
    const ignoreBlank = ignoreBlankCheckbox.checked;

    const formatted = formatWordList(text, quoteChar, delimiter, wordsPerLine, includeTrailing, ignoreBlank);
    output.textContent = formatted;
    outputSection.classList.remove('hidden');
});

clearBtn.addEventListener('click', () => {
    inputText.value = '';
    quoteCharInput.value = "'";
    delimiterInput.value = ', ';
    wordsPerLineInput.value = '';
    includeTrailingCheckbox.checked = true;
    ignoreBlankCheckbox.checked = true;
    output.textContent = '';
    outputSection.classList.add('hidden');
    hideError();
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(output.textContent).then(() => {
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
        </svg>
        Copied`;
        setTimeout(() => {
            copyBtn.innerHTML = originalCopyBtnHTML;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
        </svg>
        Failed`;
        setTimeout(() => {
            copyBtn.innerHTML = originalCopyBtnHTML;
        }, 2000);
    });
});

// Utility functions
function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
}

function hideError() {
    error.classList.add('hidden');
}