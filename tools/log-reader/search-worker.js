// Search Worker - Performs chunk-based search in background

let regex = null;
let currentLineNum = 0;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

self.onmessage = function(event) {
    const { type, id, term, matchWholeWord, matchCase, chunk, startLine } = event.data;

    if (type === 'init') {
        let flags = matchCase ? '' : 'i';
        let pattern = escapeRegExp(term);
        if (matchWholeWord) pattern = `\\b${pattern}\\b`;
regex = new RegExp(pattern, flags);
        currentLineNum = startLine || 0;
        return;
    }

    if (type === 'chunk') {
        currentLineNum = startLine;
        let lineStart = 0;
        for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] === '\n') {
                const line = chunk.slice(lineStart, i);
                if (regex.test(line)) {
                    self.postMessage({ type: 'result', id, lineNum: currentLineNum });
                }
                currentLineNum++;
                lineStart = i + 1;
            }
        }
        return;
    }

    if (type === 'done') {
        self.postMessage({ type: 'complete', id });
    }
};
