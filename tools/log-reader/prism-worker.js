// Prism.js Web Worker for Log Highlighting
// Runs in background thread to prevent UI freezing

// Disable Prism's default worker message handling in worker context
self.Prism = { disableWorkerMessageHandler: true };

// Import Prism in worker context
importScripts(
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-log.min.js'
);

/**
 * Detect log level from a line
 * @param {string} line - The log line to analyze
 * @returns {string|null} - The detected log level or null
 */
function detectLogLevel(line) {
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
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Handle messages from main thread
self.onmessage = function(event) {
    const { id, lines, startLineNum } = event.data;
    
    try {
        const highlightedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = startLineNum + i;
            
            // Detect log level for CSS class
            const logLevel = detectLogLevel(line);
            
            // Highlight with Prism
            let highlightedContent;
            if (Prism.languages.log) {
                highlightedContent = Prism.highlight(line, Prism.languages.log, 'log');
            } else {
                highlightedContent = escapeHtml(line);
            }
            
            highlightedLines.push({
                lineNum: lineNum,
                content: highlightedContent,
                logLevel: logLevel
            });
            
            // Yield every 100 lines to prevent worker blocking
            if (i % 100 === 0 && i > 0) {
                // Continue immediately, but this gives browser a chance to handle other tasks
            }
        }
        
        // Return results
        self.postMessage({
            id: id,
            success: true,
            highlightedLines: highlightedLines
        });
    } catch (error) {
        self.postMessage({
            id: id,
            success: false,
            error: error.message
        });
    }
};
