// Log Reader - Handles large log files with streaming
// Supports files up to 10GB via chunked reading

// Configuration
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

// State
let currentFile = null;
let totalLines = 0;
let lineIndex = []; // Stores byte positions for line starts
let currentPage = 1;
let linesPerPage = 1000;
let searchTerm = '';
let searchResults = []; // Line numbers that match search
let currentMatchIndex = -1; // Index of currently highlighted match
let isSearching = false;
let searchAbortController = null;
let fileReadAbortController = null;
const MAX_RESULTS_DISPLAY = 50; // Limit results shown for performance
let syntaxHighlightingEnabled = true; // One Dark syntax highlighting (default: on)

// Prism.js Web Worker for non-blocking highlighting
let prismWorker = null;
let workerJobId = 0;
const pendingJobs = new Map();

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const viewerSection = document.getElementById('viewer-section');
const uploadInput = document.getElementById('upload');
const dropZone = document.getElementById('drop-zone');
const dropText = document.getElementById('drop-text');
const fileNameEl = document.getElementById('file-name');
const fileSizeEl = document.getElementById('file-size');
const totalLinesEl = document.getElementById('total-lines');
const linesPerPageSelect = document.getElementById('lines-per-page');
const logContent = document.getElementById('log-content');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const pageInput = document.getElementById('page-input');
const pageTotal = document.getElementById('page-total');
const pageInfo = document.getElementById('page-info');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search');
const searchProgress = document.getElementById('search-progress');
const searchProgressFill = document.getElementById('search-progress-fill');
const searchInfo = document.getElementById('search-info');
const searchNav = document.getElementById('search-nav');
const matchCounter = document.getElementById('match-counter');
const btnPrevMatch = document.getElementById('btn-prev-match');
const btnNextMatch = document.getElementById('btn-next-match');
const searchResultsPanel = document.getElementById('search-results-panel');
const searchResultsToggle = document.getElementById('search-results-toggle');
const searchResultsTitleText = document.getElementById('search-results-title-text');
const searchResultsChevron = document.getElementById('search-results-chevron');
const searchResultsList = document.getElementById('search-results-list');
const searchResultsItems = document.getElementById('search-results-items');
const btnLoadMore = document.getElementById('btn-load-more');

// Event Listeners
uploadInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
linesPerPageSelect.addEventListener('change', handleLinesPerPageChange);
document.getElementById('btn-first').addEventListener('click', () => goToPage(1));
document.getElementById('btn-prev').addEventListener('click', () => goToPage(currentPage - 1));
document.getElementById('btn-next').addEventListener('click', () => goToPage(currentPage + 1));
document.getElementById('btn-last').addEventListener('click', () => goToPage(getTotalPages()));
document.getElementById('btn-top').addEventListener('click', () => scrollToTop());
document.getElementById('btn-bottom').addEventListener('click', () => scrollToBottom());
pageInput.addEventListener('change', handlePageInput);
document.getElementById('download-page').addEventListener('click', downloadCurrentPage);
searchBtn.addEventListener('click', startSearch);
clearSearchBtn.addEventListener('click', clearSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startSearch();
});

// Syntax highlighting toggle
document.getElementById('highlight-toggle').addEventListener('click', toggleSyntaxHighlighting);

// Search navigation
btnPrevMatch.addEventListener('click', () => navigateMatch(-1));
btnNextMatch.addEventListener('click', () => navigateMatch(1));

// Search results panel toggle
searchResultsToggle.addEventListener('click', toggleSearchResults);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchTerm) {
        clearSearch();
    }
    if (e.key === 'Enter' && e.shiftKey && searchResults.length > 0) {
        e.preventDefault();
        navigateMatch(-1);
    } else if (e.key === 'Enter' && searchResults.length > 0 && document.activeElement !== searchInput) {
        e.preventDefault();
        navigateMatch(1);
    }
});

// File Handling
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) loadFile(file);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
}

async function loadFile(file) {
    // Reset state
    currentFile = file;
    totalLines = 0;
    lineIndex = [];
    currentPage = 1;
    searchTerm = '';
    searchResults = [];
    currentMatchIndex = -1;
    
    // Reset search UI
    searchInput.value = '';
    searchNav.classList.add('hidden');
    searchResultsPanel.classList.add('hidden');
    searchResultsList.classList.add('hidden');
    searchResultsItems.innerHTML = '';
    
    // Update UI
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatFileSize(file.size);
    totalLinesEl.textContent = 'Counting...';
    
    // Switch to viewer
    uploadSection.classList.add('hidden');
    viewerSection.classList.remove('hidden');
    
    // Show loading
    showLoading('Building line index...');
    
    // Build line index
    fileReadAbortController = new AbortController();
    try {
        await buildLineIndex(file);
        totalLinesEl.textContent = `${formatNumber(totalLines)} lines`;
        updatePagination();
        await loadPage(1);
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error loading file:', error);
            alert('Error loading file. Please try again.');
        }
    } finally {
        hideLoading();
    }
}

// Build line index by reading file in chunks
async function buildLineIndex(file) {
    const totalSize = file.size;
    let position = 0;
    let remainder = '';

    while (position < totalSize) {
        if (fileReadAbortController.signal.aborted) {
            throw new Error('AbortError');
        }

        const chunkSize = Math.min(CHUNK_SIZE, totalSize - position);
        const chunk = file.slice(position, position + chunkSize);
        const text = await chunk.text();

        const fullText = remainder + text;
        remainder = '';

        let i = 0;
        while (i < fullText.length) {
            let char = fullText[i];

            if (char === '\n') {
                lineIndex.push(position + i + 1);
                totalLines++;
                i++;
            } else if (char === '\r') {
                if (i + 1 < fullText.length && fullText[i + 1] === '\n') {
                    lineIndex.push(position + i + 2);
                    i += 2;
                } else {
                    lineIndex.push(position + i + 1);
                    totalLines++;
                    i++;
                }
            } else {
                i++;
            }
        }

        remainder = fullText.slice(i);
        position += chunkSize;

        const progress = Math.round((position / totalSize) * 100);
        loadingText.textContent = `Building index... ${progress}% (${formatNumber(totalLines)} lines found)`;
    }

    if (remainder.length > 0) {
        lineIndex.push(position - remainder.length);
        totalLines++;
    }
}

// Load a specific page
async function loadPage(pageNum) {
    if (pageNum < 1 || pageNum > getTotalPages()) return;
    
    currentPage = pageNum;
    pageInput.value = pageNum;
    
    document.getElementById('log-container').classList.remove('expanded');
    showLoading(`Loading page ${pageNum}...`);
    
    try {
        const startLine = (pageNum - 1) * linesPerPage;
        const endLine = Math.min(startLine + linesPerPage, totalLines);
        
        const lines = await readLines(startLine, endLine);
        await renderLines(lines, startLine + 1);
        updatePageInfo(startLine + 1, endLine);
    } finally {
        hideLoading();
    }
}

// Read specific lines from file (batched for performance)
async function readLines(startLine, endLine) {
    if (startLine >= endLine) return [];

    const startPos = lineIndex[startLine];
    const endPos = lineIndex[endLine] || currentFile.size;

    const slice = currentFile.slice(startPos, endPos);
    const text = await slice.text();

    const lines = [];
    let currentLine = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '\n') {
            lines.push(currentLine);
            currentLine = '';
        } else if (char === '\r') {
            if (i + 1 < text.length && text[i + 1] === '\n') {
                lines.push(currentLine);
                currentLine = '';
                i++;
            } else {
                lines.push(currentLine);
                currentLine = '';
            }
        } else {
            currentLine += char;
        }
    }

    if (currentLine || lines.length === 0) {
        lines.push(currentLine);
    }

    return lines;
}

// Render lines to DOM with Prism.js highlighting
async function renderLines(lines, startLineNum) {
    // Show loading state for highlighting
    if (syntaxHighlightingEnabled) {
        loadingText.textContent = `Highlighting ${lines.length} lines...`;
        loadingOverlay.classList.remove('hidden');
    }
    
    try {
        let highlightedLines;
        
        if (syntaxHighlightingEnabled) {
            // Use Prism.js via Web Worker for non-blocking highlighting
            highlightedLines = await highlightLinesAsync(lines, startLineNum);
        } else {
            // Plain text - no highlighting
            highlightedLines = lines.map((line, index) => ({
                lineNum: startLineNum + index,
                content: escapeHtml(line),
                logLevel: detectLogLevelFromLine(line)
            }));
        }
        
        // Build DOM
        const fragment = document.createDocumentFragment();
        
        highlightedLines.forEach(({ lineNum, content, logLevel }) => {
            const lineEl = document.createElement('div');
            lineEl.className = 'log-line';
            lineEl.dataset.line = lineNum;
            
            // Add log level class for background tinting
            if (logLevel) {
                lineEl.classList.add(`level-${logLevel}`);
            }
            
            // Check if this is the current match
            const absoluteLineIndex = lineNum - 1;
            if (searchResults.length > 0 && currentMatchIndex >= 0) {
                const currentMatchLine = searchResults[currentMatchIndex];
                if (absoluteLineIndex === currentMatchLine) {
                    lineEl.classList.add('current-match');
                }
            }
            
            const lineNumberEl = document.createElement('span');
            lineNumberEl.className = 'line-number';
            lineNumberEl.textContent = lineNum;
            
            const contentEl = document.createElement('span');
            contentEl.className = 'line-content';
            contentEl.innerHTML = content;
            
            // Apply search highlighting on top if needed
            if (searchTerm && !syntaxHighlightingEnabled) {
                const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
                contentEl.innerHTML = content.replace(regex, match => 
                    `<span class="search-highlight">${match}</span>`
                );
            }
            
            lineEl.appendChild(lineNumberEl);
            lineEl.appendChild(contentEl);
            fragment.appendChild(lineEl);
        });
        
        logContent.innerHTML = '';
        logContent.appendChild(fragment);
        
        // Update container class based on highlighting state
        document.getElementById('log-container').classList.add('expanded');
        if (!syntaxHighlightingEnabled) {
            logContent.classList.add('syntax-highlighting-disabled');
        } else {
            logContent.classList.remove('syntax-highlighting-disabled');
        }
    } catch (error) {
        console.error('Error rendering lines:', error);
        // Fallback to plain text
        const fragment = document.createDocumentFragment();
        lines.forEach((line, index) => {
            const lineNum = startLineNum + index;
            const lineEl = document.createElement('div');
            lineEl.className = 'log-line';
            lineEl.dataset.line = lineNum;
            
            const lineNumberEl = document.createElement('span');
            lineNumberEl.className = 'line-number';
            lineNumberEl.textContent = lineNum;
            
            const contentEl = document.createElement('span');
            contentEl.className = 'line-content';
            contentEl.textContent = line;
            
            lineEl.appendChild(lineNumberEl);
            lineEl.appendChild(contentEl);
            fragment.appendChild(lineEl);
        });
        
        logContent.innerHTML = '';
        logContent.appendChild(fragment);
    } finally {
        if (syntaxHighlightingEnabled) {
            loadingOverlay.classList.add('hidden');
            document.getElementById('log-container').classList.add('expanded');
        }
    }
}

/**
 * Detect log level from a line (simple version)
 * @param {string} line - The log line to analyze
 * @returns {string|null} - The detected log level or null
 */
function detectLogLevelFromLine(line) {
    const upperLine = line.toUpperCase();
    if (/\b(ERROR|FAIL|FAILURE|FATAL|CRITICAL|ALERT|EMERGENCY|EE)\b/.test(upperLine) ||
        /\[\s*(ERROR|EROR|ERR|FATAL|FATL|FTL|E|F)\s*\]/.test(upperLine)) {
        return 'error';
    }
    if (/\b(WARNING|WARN|WW)\b/.test(upperLine) ||
        /\[\s*(WARNING|WARN|WRN|W)\s*\]/.test(upperLine)) {
        return 'warning';
    }
    if (/\b(INFO|INFORMATION|NOTICE|II)\b/.test(upperLine) ||
        /\[\s*(INFO|INF|I)\s*\]/.test(upperLine)) {
        return 'info';
    }
    if (/\b(DEBUG)\b/.test(upperLine) ||
        /\[\s*(DEBUG|DBG|D)\s*\]/.test(upperLine)) {
        return 'debug';
    }
    if (/\b(TRACE|VERBOSE)\b/.test(upperLine) ||
        /\[\s*(TRACE|VERBOSE|V)\s*\]/.test(upperLine)) {
        return 'trace';
    }
    return null;
}

/**
 * Initialize Prism Web Worker
 */
function initPrismWorker() {
    if (!prismWorker && window.Worker) {
        try {
            prismWorker = new Worker('prism-worker.js');
            
            prismWorker.onmessage = function(event) {
                const { id, success, highlightedLines, error } = event.data;
                const job = pendingJobs.get(id);
                
                if (job) {
                    pendingJobs.delete(id);
                    
                    if (success) {
                        job.resolve(highlightedLines);
                    } else {
                        job.reject(new Error(error));
                    }
                }
            };
            
            prismWorker.onerror = function(error) {
                console.error('Prism Worker error:', error);
                // Reject all pending jobs
                pendingJobs.forEach((job) => {
                    job.reject(error);
                });
                pendingJobs.clear();
            };
        } catch (e) {
            console.warn('Failed to initialize Prism Worker:', e);
            prismWorker = null;
        }
    }
}

/**
 * Terminate Prism Web Worker
 */
function terminatePrismWorker() {
    if (prismWorker) {
        prismWorker.terminate();
        prismWorker = null;
        pendingJobs.clear();
    }
}

/**
 * Highlight lines using Prism.js via Web Worker
 * @param {string[]} lines - Array of lines to highlight
 * @param {number} startLineNum - Starting line number
 * @returns {Promise<Array>} - Promise resolving to highlighted lines
 */
async function highlightLinesAsync(lines, startLineNum) {
    // If Worker not available, fallback to synchronous Prism highlighting
    if (!prismWorker) {
        return lines.map((line, index) => ({
            lineNum: startLineNum + index,
            content: highlightWithPrism(line),
            logLevel: detectLogLevelFromLine(line)
        }));
    }
    
    // Create job
    const id = ++workerJobId;
    const jobPromise = new Promise((resolve, reject) => {
        pendingJobs.set(id, { resolve, reject });
    });
    
    // Post to worker
    prismWorker.postMessage({
        id: id,
        lines: lines,
        startLineNum: startLineNum
    });
    
    return jobPromise;
}

/**
 * Highlight a single line with Prism.js (synchronous fallback)
 * @param {string} line - Line to highlight
 * @returns {string} - Highlighted HTML
 */
function highlightWithPrism(line) {
    if (!line) return '';
    
    try {
        if (Prism.languages.log) {
            return Prism.highlight(line, Prism.languages.log, 'log');
        }
    } catch (e) {
        console.warn('Prism highlighting failed:', e);
    }
    
    return escapeHtml(line);
}

// Pagination Controls
function goToPage(pageNum) {
    const totalPages = getTotalPages();
    if (pageNum < 1) pageNum = 1;
    if (pageNum > totalPages) pageNum = totalPages;
    loadPage(pageNum);
}

function handlePageInput(e) {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page)) {
        goToPage(page);
    }
}

function handleLinesPerPageChange(e) {
    linesPerPage = parseInt(e.target.value, 10);
    currentPage = 1;
    updatePagination();
    loadPage(1);
}

function getTotalPages() {
    return Math.ceil(totalLines / linesPerPage);
}

function updatePagination() {
    const totalPages = getTotalPages();
    pageTotal.textContent = `of ${formatNumber(totalPages)}`;
    pageInput.max = totalPages;
}

function updatePageInfo(startLine, endLine) {
    pageInfo.textContent = `Lines ${formatNumber(startLine)} - ${formatNumber(endLine)} of ${formatNumber(totalLines)}`;
}

// Search Functionality
async function startSearch() {
    const term = searchInput.value.trim();
    if (!term || isSearching) return;
    
    // Clear previous search
    clearSearch();
    
    searchTerm = term;
    isSearching = true;
    searchResults = [];
    
    // Show progress
    searchProgress.classList.remove('hidden');
    searchProgressFill.style.width = '0%';
    searchInfo.textContent = 'Searching...';
    clearSearchBtn.classList.remove('hidden');
    
    searchAbortController = new AbortController();
    
    try {
        // Search through file chunk by chunk
        const totalSize = currentFile.size;
        let position = 0;
        let lineNum = 0;
        let buffer = '';
        
        while (position < totalSize) {
            if (searchAbortController.signal.aborted) {
                throw new Error('AbortError');
            }
            
            const chunkSize = Math.min(CHUNK_SIZE, totalSize - position);
            const chunk = currentFile.slice(position, position + chunkSize);
            const text = await chunk.text();
            
            buffer += text;
            
            // Process lines
            let lineStart = 0;
            for (let i = 0; i < buffer.length; i++) {
                if (buffer[i] === '\n') {
                    const line = buffer.slice(lineStart, i);
                    if (line.toLowerCase().includes(term.toLowerCase())) {
                        searchResults.push(lineNum);
                    }
                    lineNum++;
                    lineStart = i + 1;
                }
            }
            
            // Keep remainder
            buffer = buffer.slice(lineStart);
            position += chunkSize;
            
            // Update progress
            const progress = Math.round((position / totalSize) * 100);
            searchProgressFill.style.width = `${progress}%`;
            searchInfo.textContent = `Searching... ${progress}% (${formatNumber(searchResults.length)} matches)`;
        }
        
        // Check last line
        if (buffer.length > 0) {
            if (buffer.toLowerCase().includes(term.toLowerCase())) {
                searchResults.push(lineNum);
            }
        }
        
        // Show results
        searchProgress.classList.add('hidden');
        
        if (searchResults.length === 0) {
            searchInfo.textContent = 'No matches found';
            searchNav.classList.add('hidden');
            searchResultsPanel.classList.add('hidden');
        } else {
            searchInfo.textContent = `Found ${formatNumber(searchResults.length)} matches`;
            
            // Show navigation
            searchNav.classList.remove('hidden');
            searchResultsPanel.classList.remove('hidden');
            
            // Update results title
            searchResultsTitleText.textContent = `Search Results (${formatNumber(searchResults.length)} matches)`;
            
            // Auto-jump to first match
            currentMatchIndex = -1;
            await navigateMatch(1);
            
            // Populate results panel
            await populateSearchResults();
        }
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Search error:', error);
            searchInfo.textContent = 'Search failed';
        }
    } finally {
        isSearching = false;
    }
}

function clearSearch() {
    // Abort ongoing search
    if (searchAbortController) {
        searchAbortController.abort();
    }
    
    searchTerm = '';
    searchResults = [];
    currentMatchIndex = -1;
    isSearching = false;
    
    searchInput.value = '';
    searchProgress.classList.add('hidden');
    searchInfo.textContent = '';
    clearSearchBtn.classList.add('hidden');
    searchNav.classList.add('hidden');
    searchResultsPanel.classList.add('hidden');
    searchResultsList.classList.add('hidden');
    searchResultsChevron.style.transform = 'rotate(0deg)';
    
    // Reload current page without highlights
    loadPage(currentPage);
}

// Navigate to next/previous match
async function navigateMatch(direction) {
    if (searchResults.length === 0) return;
    
    // Update current match index
    currentMatchIndex += direction;
    
    // Wrap around
    if (currentMatchIndex < 0) {
        currentMatchIndex = searchResults.length - 1;
    } else if (currentMatchIndex >= searchResults.length) {
        currentMatchIndex = 0;
    }
    
    // Get the line number of the current match
    const targetLine = searchResults[currentMatchIndex];
    
    // Calculate which page this line is on
    const targetPage = Math.floor(targetLine / linesPerPage) + 1;
    
    // Update match counter
    updateMatchCounter();
    
    // Load the page if different
    if (targetPage !== currentPage) {
        await loadPage(targetPage);
    } else {
        // Just re-render to update highlights
        const startLine = (currentPage - 1) * linesPerPage;
        const endLine = Math.min(startLine + linesPerPage, totalLines);
        const lines = await readLines(startLine, endLine);
        await renderLines(lines, startLine + 1);
    }
    
    // Scroll to the match
    scrollToMatch(targetLine);
    
    // Update active state in results panel
    updateActiveResultItem();
}

// Scroll to a specific match in the log
function scrollToMatch(lineNum) {
    const logLines = logContent.querySelectorAll('.log-line');
    const relativeLineIndex = lineNum - ((currentPage - 1) * linesPerPage);
    
    if (logLines[relativeLineIndex]) {
        logLines[relativeLineIndex].classList.add('current-match');
        logLines[relativeLineIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Scroll to top of log content
function scrollToTop() {
    document.getElementById('log-top-anchor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Scroll to bottom of log content
function scrollToBottom() {
    document.getElementById('log-bottom-anchor').scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Update match counter display
function updateMatchCounter() {
    if (searchResults.length === 0) {
        matchCounter.textContent = 'No matches';
    } else {
        matchCounter.textContent = `Match ${currentMatchIndex + 1} of ${searchResults.length}`;
    }
}

// Toggle search results panel
function toggleSearchResults() {
    const isExpanded = !searchResultsList.classList.contains('hidden');
    
    if (isExpanded) {
        searchResultsList.classList.add('hidden');
        searchResultsChevron.style.transform = 'rotate(0deg)';
    } else {
        searchResultsList.classList.remove('hidden');
        searchResultsChevron.style.transform = 'rotate(180deg)';
        // Populate results if not already done
        if (searchResultsItems.children.length === 0 && searchResults.length > 0) {
            populateSearchResults();
        }
    }
}

// Populate search results panel
async function populateSearchResults() {
    searchResultsItems.innerHTML = '';
    
    // Limit results for performance
    const resultsToShow = Math.min(searchResults.length, MAX_RESULTS_DISPLAY);
    
    for (let i = 0; i < resultsToShow; i++) {
        const lineNum = searchResults[i];
        const line = await readLine(lineNum);
        
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.dataset.index = i;
        resultItem.dataset.line = lineNum;
        
        if (i === currentMatchIndex) {
            resultItem.classList.add('active');
        }
        
        const lineNumEl = document.createElement('span');
        lineNumEl.className = 'search-result-line-num';
        lineNumEl.textContent = lineNum + 1;
        
        const contentEl = document.createElement('span');
        contentEl.className = 'search-result-content';
        
        // Highlight search term
        const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
        const highlighted = line.replace(regex, match => `<span class="search-result-highlight">${match}</span>`);
        contentEl.innerHTML = highlighted;
        
        resultItem.appendChild(lineNumEl);
        resultItem.appendChild(contentEl);
        
        // Click handler
        resultItem.addEventListener('click', () => {
            currentMatchIndex = i;
            navigateMatch(0); // Navigate to this match
            updateActiveResultItem();
        });
        
        searchResultsItems.appendChild(resultItem);
    }
    
    // Show load more button if there are more results
    if (searchResults.length > MAX_RESULTS_DISPLAY) {
        btnLoadMore.classList.remove('hidden');
        btnLoadMore.textContent = `Load more (${searchResults.length - MAX_RESULTS_DISPLAY} remaining)`;
    } else {
        btnLoadMore.classList.add('hidden');
    }
}

// Update active result item styling
function updateActiveResultItem() {
    const items = searchResultsItems.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
        if (index === currentMatchIndex) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

// Download current page
async function downloadCurrentPage() {
    const startLine = (currentPage - 1) * linesPerPage;
    const endLine = Math.min(startLine + linesPerPage, totalLines);
    
    const lines = await readLines(startLine, endLine);
    const content = lines.join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFile.name.replace(/\.[^/.]+$/, '')}_page${currentPage}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

// UI Helpers
function showLoading(text) {
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num) {
    return num.toLocaleString();
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle syntax highlighting
function toggleSyntaxHighlighting() {
    syntaxHighlightingEnabled = !syntaxHighlightingEnabled;
    
    // Update toggle button state
    const toggleBtn = document.getElementById('highlight-toggle');
    const toggleSpan = toggleBtn.querySelector('span');
    
    if (syntaxHighlightingEnabled) {
        toggleBtn.classList.add('active');
        toggleSpan.textContent = 'Highlight';
        initPrismWorker();
    } else {
        toggleBtn.classList.remove('active');
        toggleSpan.textContent = 'Plain';
    }
    
    // Re-render current page with new highlighting state
    loadPage(currentPage);
}

// Initialize Prism Worker when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (syntaxHighlightingEnabled) {
        initPrismWorker();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    terminatePrismWorker();
});