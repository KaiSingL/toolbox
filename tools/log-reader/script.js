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
let matchWholeWord = false; // Match whole word only
let matchCase = false; // Match case sensitive
let sidePanelVisible = false; // Side panel visibility state

// Prism.js Web Worker for non-blocking highlighting
let prismWorker = null;
let workerJobId = 0;
const pendingJobs = new Map();

// Search Worker for fast chunk-based searching
let searchWorker = null;
let searchJobId = 0;
const pendingSearchJobs = new Map();

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
const clearSearchBtn = document.getElementById('clear-search');
const searchProgress = document.getElementById('search-progress');
const searchProgressFill = document.getElementById('search-progress-fill');
const sidePanelNav = document.getElementById('side-panel-nav');
const matchCounterSide = document.getElementById('match-counter-side');
const btnPrevMatchSide = document.getElementById('btn-prev-match-side');
const btnNextMatchSide = document.getElementById('btn-next-match-side');
const matchNavigation = document.getElementById('match-navigation');
const matchCounterHeader = document.getElementById('match-counter-header');
const btnPrevMatchHeader = document.getElementById('btn-prev-match-header');
const btnNextMatchHeader = document.getElementById('btn-next-match-header');
const searchResultsTitleText = document.getElementById('search-results-title-text');
const searchResultsList = document.getElementById('search-results-list');
const searchResultsItems = document.getElementById('search-results-items');
const btnLoadMore = document.getElementById('btn-load-more');
const wholeWordCheckbox = document.getElementById('option-whole-word');
const matchCaseCheckbox = document.getElementById('option-match-case');
const searchHeader = document.getElementById('search-header');
const sidePanel = document.getElementById('search-side-panel');
const toggleSidePanelBtn = document.getElementById('toggle-side-panel');
const viewerGrid = document.getElementById('viewer-grid');

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
clearSearchBtn.addEventListener('click', clearSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startSearch();
});

// Syntax highlighting toggle
document.getElementById('highlight-toggle').addEventListener('click', toggleSyntaxHighlighting);

// Search navigation - Side panel
btnPrevMatchSide.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateMatch(-1);
});
btnNextMatchSide.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateMatch(1);
});

// Search navigation - Header
if (btnPrevMatchHeader) {
    btnPrevMatchHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateMatch(-1);
    });
}
if (btnNextMatchHeader) {
    btnNextMatchHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateMatch(1);
    });
}

// Load more results button
btnLoadMore.addEventListener('click', loadMoreResults);

// Side panel toggle button
toggleSidePanelBtn.addEventListener('click', toggleSidePanel);

// Search option toggles
wholeWordCheckbox.addEventListener('change', () => {
    matchWholeWord = wholeWordCheckbox.checked;
});
matchCaseCheckbox.addEventListener('change', () => {
    matchCase = matchCaseCheckbox.checked;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchTerm) {
        clearSearch();
    }
    if (e.key === 'Escape' && sidePanelVisible && window.innerWidth <= 900) {
        toggleSidePanel();
    }
    if (e.key === 'b' || e.key === 'B') {
        if (document.activeElement === searchInput || document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            toggleSidePanel();
        }
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
    sidePanelVisible = false;
    
    // Reset search UI
    searchInput.value = '';
    sidePanelNav.classList.add('hidden');
    matchNavigation.classList.add('hidden');
    sidePanel.classList.add('hidden');
    searchResultsList.classList.add('hidden');
    searchResultsItems.innerHTML = '';
    toggleSidePanelBtn.classList.remove('active');
    
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

    // Initialize lineIndex with position 0 (first line always starts at byte 0)
    lineIndex = [0];
    totalLines = 1;

    while (position < totalSize) {
        if (fileReadAbortController.signal.aborted) {
            throw new Error('AbortError');
        }

        const chunkSize = Math.min(CHUNK_SIZE, totalSize - position);
        const chunk = file.slice(position, position + chunkSize);
        const text = await chunk.text();

        const fullText = remainder + text;

        // Process only the NEW text portion, not the remainder
        let i = remainder.length;  // Skip remainder chars at start
        let textProcessed = 0;

        while (i < fullText.length) {
            let char = fullText[i];

            if (char === '\n') {
                lineIndex.push(position + i + 1);
                totalLines++;
                i++;
            } else if (char === '\r') {
                if (i + 1 < fullText.length && fullText[i + 1] === '\n') {
                    lineIndex.push(position + i + 2);
                    totalLines++;
                    i += 2;
                } else {
                    lineIndex.push(position + i + 1);
                    totalLines++;
                    i++;
                }
            } else {
                i++;
            }
            textProcessed++;
        }

        // Save remainder - everything after what we just processed
        remainder = fullText.slice(i);

        position += chunkSize;

        const progress = Math.round((position / totalSize) * 100);
        loadingText.textContent = `Building index... ${progress}% (${formatNumber(totalLines)} lines found)`;
    }

    // Handle final remainder (last line of file, may not end with newline)
    if (remainder.length > 0) {
        lineIndex.push(position - remainder.length);
        totalLines++;
    } else if (totalSize > 0 && lineIndex.length === totalLines) {
        // File ends with newline - add position for final empty line
        lineIndex.push(position);
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
        updatePageButtons();
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

    if (currentLine || lines.length < (endLine - startLine)) {
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
            if (searchResults.length > 0 && currentMatchIndex >= 0) {
                const currentMatchLine = searchResults[currentMatchIndex];
                if (lineNum === currentMatchLine) {
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
 * Initialize Search Worker for fast chunk-based searching
 */
function initSearchWorker() {
    if (!searchWorker && window.Worker) {
        try {
            searchWorker = new Worker('search-worker.js');

            searchWorker.onmessage = function(event) {
                const { type, id, lineNum } = event.data;
                const job = pendingSearchJobs.get(id);

                if (job) {
                    if (type === 'result') {
                        job.results.push(lineNum);
                    } else if (type === 'complete') {
                        job.resolve(job.results);
                        pendingSearchJobs.delete(id);
                    }
                }
            };

            searchWorker.onerror = function(error) {
                console.error('Search Worker error:', error);
                pendingSearchJobs.forEach((job) => {
                    job.reject(error);
                });
                pendingSearchJobs.clear();
            };
        } catch (e) {
            console.warn('Failed to initialize Search Worker:', e);
            searchWorker = null;
        }
    }
}

/**
 * Terminate Search Worker
 */
function terminateSearchWorker() {
    if (searchWorker) {
        searchWorker.terminate();
        searchWorker = null;
        pendingSearchJobs.clear();
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
async function goToPage(pageNum) {
    const totalPages = getTotalPages();
    if (pageNum < 1) pageNum = 1;
    if (pageNum > totalPages) pageNum = totalPages;
    await loadPage(pageNum);
    scrollToTop();
}

function handlePageInput(e) {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page)) {
        goToPage(page);
    }
}

async function handleLinesPerPageChange(e) {
    linesPerPage = parseInt(e.target.value, 10);
    currentPage = 1;
    updatePagination();
    await loadPage(1);
    scrollToTop();
}

function getTotalPages() {
    return Math.ceil(totalLines / linesPerPage);
}

function updatePagination() {
    const totalPages = getTotalPages();
    pageTotal.textContent = `of ${formatNumber(totalPages)}`;
    pageInput.max = totalPages;
    updatePageButtons();
}

function updatePageButtons() {
    const totalPages = getTotalPages();
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    document.getElementById('btn-first').disabled = isFirstPage;
    document.getElementById('btn-prev').disabled = isFirstPage;
    document.getElementById('btn-next').disabled = isLastPage;
    document.getElementById('btn-last').disabled = isLastPage;
}

function updatePageInfo(startLine, endLine) {
    pageInfo.textContent = `Lines ${formatNumber(startLine)} - ${formatNumber(endLine)} of ${formatNumber(totalLines)}`;
}

// Search Functionality
async function startSearch() {
    const term = searchInput.value.trim();
    if (!term || isSearching) return;

    // Expand search bar
    expandSearchBar();

    // Abort previous search
    if (searchAbortController) {
        searchAbortController.abort();
    }

    searchTerm = term;
    isSearching = true;
    searchResults = [];
    currentMatchIndex = -1;
    loadedResultsCount = 0;

    // Show progress
    searchProgress.classList.remove('hidden');
searchProgressFill.style.width = '0%';
    clearSearchBtn.classList.remove('hidden');

    searchAbortController = new AbortController();

    try {
        // Initialize worker
        if (!searchWorker) {
            initSearchWorker();
        }

        if (!searchWorker) {
            // Fallback to main thread search
            await searchOnMainThread(term);
        } else {
            // Use worker
            await searchWithWorker(term);
        }

        // Show results
        searchProgress.classList.add('hidden');

        // Handle empty file or no matches
        if (totalLines === 0 || searchResults.length === 0) {
            sidePanelNav.classList.add('hidden');
            if (searchResults.length === 0 && searchTerm) {
                // Show "No results" in match navigation
                matchNavigation.classList.remove('hidden');
                matchNavigation.classList.add('no-results');
                matchCounterHeader.textContent = 'No results';
            } else {
                matchNavigation.classList.add('hidden');
                matchNavigation.classList.remove('no-results');
            }
            sidePanel.classList.add('hidden');
            sidePanelVisible = false;
            toggleSidePanelBtn.classList.remove('active');
        } else {
            // Show match navigation in header (always visible when results exist)
            matchNavigation.classList.remove('hidden');
            
            // Show side panel nav when results exist
            sidePanelNav.classList.remove('hidden');
            
            // Ensure side panel is visible
            sidePanel.classList.remove('hidden');
            sidePanelVisible = true;
            toggleSidePanelBtn.classList.add('active');
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
        }
    } finally {
        isSearching = false;
    }
}

async function searchWithWorker(term) {
    const jobId = ++searchJobId;
    const CHUNK_SIZE = 1024 * 1024;
    let totalChunks = Math.ceil(currentFile.size / CHUNK_SIZE);
    let processedChunks = 0;
    let lastLineIndex = 0;

    // Create job promise
    const jobPromise = new Promise((resolve, reject) => {
        pendingSearchJobs.set(jobId, { resolve, reject, results: [] });
    });

    // Initialize worker with search params
    searchWorker.postMessage({
        type: 'init',
        id: jobId,
        term,
        matchWholeWord,
        matchCase
    });

    // Read file in chunks and send to worker
    for (let pos = 0; pos < currentFile.size; pos += CHUNK_SIZE) {
        if (searchAbortController.signal.aborted) {
            throw new Error('AbortError');
        }

        const chunkEnd = Math.min(pos + CHUNK_SIZE, currentFile.size);
        const chunk = await currentFile.slice(pos, chunkEnd).text();

        // Find first line number in this chunk using lineIndex (optimized)
        while (lastLineIndex < lineIndex.length && lineIndex[lastLineIndex] < pos) {
            lastLineIndex++;
        }
        const startLine = lastLineIndex;

        searchWorker.postMessage({
            type: 'chunk',
            id: jobId,
            chunk,
            startLine
        });

// Update progress
        processedChunks++;
        const progress = Math.round((processedChunks / totalChunks) * 100);
        searchProgressFill.style.width = `${progress}%`;
    }

    // Signal done
    searchWorker.postMessage({ type: 'done', id: jobId });

    // Wait for results
    searchResults = await jobPromise;
}

async function searchOnMainThread(term) {
    // Fallback: search on main thread (slower but reliable)
    let regexFlags = matchCase ? '' : 'i';
    let pattern = escapeRegExp(term);
    if (matchWholeWord) pattern = `\\b${pattern}\\b`;
    const regex = new RegExp(pattern, regexFlags);

    const CHUNK_SIZE = 1024 * 1024;
    let totalChunks = Math.ceil(currentFile.size / CHUNK_SIZE);
    let processedChunks = 0;
    let lastLineIndex = 0;
    let hasTrailingNewline = true;

    for (let pos = 0; pos < currentFile.size; pos += CHUNK_SIZE) {
        if (searchAbortController.signal.aborted) {
            throw new Error('AbortError');
        }

        const chunkEnd = Math.min(pos + CHUNK_SIZE, currentFile.size);
        const chunk = await currentFile.slice(pos, chunkEnd).text();

        // Find first line number in this chunk (optimized)
        while (lastLineIndex < lineIndex.length && lineIndex[lastLineIndex] < pos) {
            lastLineIndex++;
        }
        const startLine = lastLineIndex;

        // Check if chunk ends with newline
        hasTrailingNewline = chunk.length > 0 && (chunk[chunk.length - 1] === '\n' || chunk[chunk.length - 1] === '\r');

        // Search chunk
        let lineStart = 0;
        let currentLine = startLine;
        for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] === '\n') {
                const line = chunk.slice(lineStart, i);
                if (regex.test(line)) {
                    searchResults.push(currentLine);
                }
                currentLine++;
                lineStart = i + 1;
            }
        }
        
        // Only count the remaining text as a line if it doesn't end with newline
        if (lineStart < chunk.length && !hasTrailingNewline) {
            currentLine++;
        }

// Update progress
        processedChunks++;
        const progress = Math.round((processedChunks / totalChunks) * 100);
        searchProgressFill.style.width = `${progress}%`;
    }
}

function clearSearch() {
    if (searchAbortController) {
        searchAbortController.abort();
    }

    searchTerm = '';
    searchResults = [];
    currentMatchIndex = -1;
    isSearching = false;

    searchInput.value = '';
    searchProgress.classList.add('hidden');
    clearSearchBtn.classList.add('hidden');
    sidePanelNav.classList.add('hidden');
    matchNavigation.classList.add('hidden');
    matchNavigation.classList.remove('no-results');
    sidePanel.classList.add('hidden');
    sidePanelVisible = false;
    toggleSidePanelBtn.classList.remove('active');
    searchResultsList.classList.add('hidden');

    // Terminate search worker
    terminateSearchWorker();

    // Reload current page without highlights
    loadPage(currentPage);
}

// Navigate to next/previous match
async function navigateMatch(direction) {
    if (searchResults.length === 0 || totalLines === 0) return;
    
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
    const relativeLineIndex = lineNum - 1 - ((currentPage - 1) * linesPerPage);
    
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

// Update match counter display (syncs both header and side panel)
function updateMatchCounter() {
    const text = searchResults.length === 0 ? 'No matches' : `${currentMatchIndex + 1} of ${searchResults.length}`;
    if (matchCounterSide) matchCounterSide.textContent = text;
    if (matchCounterHeader) matchCounterHeader.textContent = text;
}

// Toggle side panel
function toggleSidePanel() {
    sidePanelVisible = !sidePanelVisible;
    
    if (sidePanelVisible) {
        sidePanel.classList.remove('hidden');
        toggleSidePanelBtn.classList.add('active');
        // Show side panel nav only if there are results
        if (searchResults.length > 0) {
            sidePanelNav.classList.remove('hidden');
        }
    } else {
        sidePanel.classList.add('hidden');
        toggleSidePanelBtn.classList.remove('active');
        sidePanelNav.classList.add('hidden');
    }
}

// Toggle search results panel (legacy function for compatibility)
function toggleSearchResults() {
    toggleSidePanel();
}

// Read a single line by line number
async function readLine(lineNum) {
    if (lineNum < 0 || lineNum >= totalLines) return '';

    const startPos = lineIndex[lineNum];
    const endPos = lineIndex[lineNum + 1] || currentFile.size;

    const slice = currentFile.slice(startPos, endPos);
    const text = await slice.text();

    return text.replace(/[\r\n]+$/, '');
}

// Populate search results panel
async function populateSearchResults() {
    if (totalLines === 0 || searchResults.length === 0) {
        searchResultsItems.innerHTML = '<div class="empty-state">No matches found</div>';
        searchResultsList.classList.remove('hidden');
        return;
    }

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

        // Line number header
        const lineHeader = document.createElement('div');
        lineHeader.className = 'search-result-header';

        const lineNumEl = document.createElement('span');
        lineNumEl.className = 'search-result-line-num';
        lineNumEl.textContent = `Line ${lineNum}`;

        lineHeader.appendChild(lineNumEl);
        resultItem.appendChild(lineHeader);

        // Line content with truncation
        const contentEl = document.createElement('div');
        contentEl.className = 'search-result-content';

        const MAX_PREVIEW_LENGTH = 300;
        const isLongLine = line.length > MAX_PREVIEW_LENGTH;

        if (isLongLine) {
            // Truncated view with expand capability
            const truncated = line.substring(0, MAX_PREVIEW_LENGTH);
            const regex = new RegExp(escapeRegExp(searchTerm), matchCase ? '' : 'gi');

            // Find match position for context
            const match = regex.exec(truncated);
            const matchStart = match ? match.index : 0;
            const matchEnd = match ? match.index + match[0].length : 0;

            // Show context around match if possible
            let contextStart = Math.max(0, matchStart - 50);
            let contextEnd = Math.min(truncated.length, matchEnd + 100);
            let truncatedContent = line.substring(contextStart, contextEnd);

            if (contextStart > 0) truncatedContent = '...' + truncatedContent;
            if (contextEnd < line.length) truncatedContent = truncatedContent + '...';

            contentEl.innerHTML = `<span class="line-text">${escapeHtml(truncatedContent)}</span><span class="expand-indicator">Show more</span>`;
            resultItem.classList.add('truncated');
        } else {
            // Full line
            const regex = new RegExp(escapeRegExp(searchTerm), matchCase ? '' : 'gi');
            const highlighted = line.replace(regex, match => `<span class="search-highlight">${escapeHtml(match)}</span>`);
            contentEl.innerHTML = `<span class="line-text">${highlighted}</span>`;
        }

        resultItem.appendChild(contentEl);

        // Click handler - navigate to line
        resultItem.addEventListener('click', () => {
            currentMatchIndex = i;
            navigateMatch(0);
            updateActiveResultItem();
        });

        searchResultsItems.appendChild(resultItem);
    }

    searchResultsList.classList.remove('hidden');

    // Show load more button if there are more results
    if (searchResults.length > MAX_RESULTS_DISPLAY) {
        btnLoadMore.classList.remove('hidden');
        btnLoadMore.textContent = `Load more (${searchResults.length - MAX_RESULTS_DISPLAY} remaining)`;
    } else {
        btnLoadMore.classList.add('hidden');
    }
}

// Load more search results
let loadedResultsCount = MAX_RESULTS_DISPLAY;

async function loadMoreResults() {
    if (searchResults.length <= loadedResultsCount) return;

    const startIndex = loadedResultsCount;
    const endIndex = Math.min(startIndex + MAX_RESULTS_DISPLAY, searchResults.length);

    for (let i = startIndex; i < endIndex; i++) {
        const lineNum = searchResults[i];
        const line = await readLine(lineNum);

        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.dataset.index = i;
        resultItem.dataset.line = lineNum;

        // Line number header
        const lineHeader = document.createElement('div');
        lineHeader.className = 'search-result-header';

        const lineNumEl = document.createElement('span');
        lineNumEl.className = 'search-result-line-num';
        lineNumEl.textContent = `Line ${lineNum}`;

        lineHeader.appendChild(lineNumEl);
        resultItem.appendChild(lineHeader);

        // Line content
        const contentEl = document.createElement('div');
        contentEl.className = 'search-result-content';

        const MAX_PREVIEW_LENGTH = 300;
        const isLongLine = line.length > MAX_PREVIEW_LENGTH;

        if (isLongLine) {
            const truncated = line.substring(0, MAX_PREVIEW_LENGTH);
            const regex = new RegExp(escapeRegExp(searchTerm), matchCase ? '' : 'gi');
            const match = regex.exec(truncated);
            const matchStart = match ? match.index : 0;
            const matchEnd = match ? match.index + match[0].length : 0;
            let contextStart = Math.max(0, matchStart - 50);
            let contextEnd = Math.min(truncated.length, matchEnd + 100);
            let truncatedContent = line.substring(contextStart, contextEnd);
            if (contextStart > 0) truncatedContent = '...' + truncatedContent;
            if (contextEnd < line.length) truncatedContent = truncatedContent + '...';
            contentEl.innerHTML = `<span class="line-text">${escapeHtml(truncatedContent)}</span><span class="expand-indicator">Show more</span>`;
            resultItem.classList.add('truncated');
        } else {
            const regex = new RegExp(escapeRegExp(searchTerm), matchCase ? '' : 'gi');
            const highlighted = line.replace(regex, match => `<span class="search-highlight">${escapeHtml(match)}</span>`);
            contentEl.innerHTML = `<span class="line-text">${highlighted}</span>`;
        }

        resultItem.appendChild(contentEl);

        // Click handler
        resultItem.addEventListener('click', () => {
            currentMatchIndex = i;
            navigateMatch(0);
            updateActiveResultItem();
        });

        searchResultsItems.appendChild(resultItem);
    }

    loadedResultsCount = endIndex;

    if (endIndex >= searchResults.length) {
        btnLoadMore.classList.add('hidden');
    } else {
        btnLoadMore.textContent = `Load more (${searchResults.length - endIndex} remaining)`;
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
    a.download = `${currentFile.name.replace(/\.[^/.]+$/, '')}_line${startLine + 1}-line${endLine}.log`;
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

// Scroll Detection for Unified Header
let uploadSectionObserver = null;
let hasSearchBeenExpanded = false;

function initScrollDetection() {
    const uploadSection = document.getElementById('upload-section');
    const searchExpandable = document.querySelector('.search-expandable');

    if (!uploadSection || !searchExpandable) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0
    };

    uploadSectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                // Upload section is off-screen - expand search
                searchExpandable.classList.add('expanded');
                hasSearchBeenExpanded = true;
            } else {
                // Upload section is visible - collapse search (only if we haven't searched yet)
                if (!hasSearchBeenExpanded) {
                    searchExpandable.classList.remove('expanded');
                }
            }
        });
    }, observerOptions);

    uploadSectionObserver.observe(uploadSection);
}

function expandSearchBar() {
    const searchExpandable = document.querySelector('.search-expandable');
    if (searchExpandable) {
        searchExpandable.classList.add('expanded');
        hasSearchBeenExpanded = true;
    }
}

// Initialize Prism Worker and Search Worker when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (syntaxHighlightingEnabled) {
        initPrismWorker();
    }
    initSearchWorker();
    initScrollDetection();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (uploadSectionObserver) {
        uploadSectionObserver.disconnect();
    }
    terminatePrismWorker();
    terminateSearchWorker();
});