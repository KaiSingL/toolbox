import { Decoration, EditorView, ViewPlugin } from '@codemirror/view';
import { RangeSetBuilder, StateField, StateEffect } from '@codemirror/state';

const hiddenMark = Decoration.mark({ class: 'cm-md-hidden' });

const boldMark = Decoration.mark({ class: 'cm-md-bold' });
const italicMark = Decoration.mark({ class: 'cm-md-italic' });
const strikeMark = Decoration.mark({ class: 'cm-md-strike' });
const codeMark = Decoration.mark({ class: 'cm-md-code' });
const linkMark = Decoration.mark({ class: 'cm-md-link' });
const blockquoteMark = Decoration.mark({ class: 'cm-md-blockquote' });
const listMarkerMark = Decoration.mark({ class: 'cm-md-list-marker' });
const headerMark = Decoration.mark({ class: 'cm-md-header' });

const boldColorMark = Decoration.mark({ class: 'cm-md-bold-color' });
const italicColorMark = Decoration.mark({ class: 'cm-md-italic-color' });
const strikeColorMark = Decoration.mark({ class: 'cm-md-strike-color' });
const codeColorMark = Decoration.mark({ class: 'cm-md-code-color' });
const linkColorMark = Decoration.mark({ class: 'cm-md-link-color' });
const blockquoteColorMark = Decoration.mark({ class: 'cm-md-blockquote-color' });
const plainMark = Decoration.mark({ class: 'cm-md-plain' });

const ghostBoldMark = Decoration.mark({ class: 'cm-md-ghost-bold' });
const ghostItalicMark = Decoration.mark({ class: 'cm-md-ghost-italic' });
const ghostStrikeMark = Decoration.mark({ class: 'cm-md-ghost-strike' });
const ghostCodeMark = Decoration.mark({ class: 'cm-md-ghost-code' });
const ghostLinkMark = Decoration.mark({ class: 'cm-md-ghost-link' });
const ghostBlockquoteMark = Decoration.mark({ class: 'cm-md-ghost-blockquote' });
const ghostListMarkerMark = Decoration.mark({ class: 'cm-md-ghost-list-marker' });
const ghostMark = Decoration.mark({ class: 'cm-md-ghost' });

export const setRenderMode = StateEffect.define();

export const renderModeField = StateField.define({
    create: () => 'rendered',
    update: (value, tr) => {
        for (const effect of tr.effects) {
            if (effect.is(setRenderMode)) {
                return effect.value;
            }
        }
        return value;
    }
});

const headingMarks = {
    1: Decoration.mark({ class: 'cm-md-h1' }),
    2: Decoration.mark({ class: 'cm-md-h2' }),
    3: Decoration.mark({ class: 'cm-md-h3' }),
    4: Decoration.mark({ class: 'cm-md-h4' }),
    5: Decoration.mark({ class: 'cm-md-h5' }),
    6: Decoration.mark({ class: 'cm-md-h6' })
};

const ghostHeadingMarks = {
    1: Decoration.mark({ class: 'cm-md-ghost-h1' }),
    2: Decoration.mark({ class: 'cm-md-ghost-h2' }),
    3: Decoration.mark({ class: 'cm-md-ghost-h3' }),
    4: Decoration.mark({ class: 'cm-md-ghost-h4' }),
    5: Decoration.mark({ class: 'cm-md-ghost-h5' }),
    6: Decoration.mark({ class: 'cm-md-ghost-h6' })
};

function getVisibilityState(cursorPos, lineFrom, lineTo) {
    const cursorOnLine = cursorPos >= lineFrom && cursorPos <= lineTo;
    return cursorOnLine ? 'ghost' : 'hidden';
}

function parseLineDecorations(line, lineFrom, cursorPos, mode) {
    const decorations = [];
    const lineTo = lineFrom + line.length;
    const isRaw = mode === 'raw';
    const state = getVisibilityState(cursorPos, lineFrom, lineTo);
    
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
        const level = headingMatch[1].length;
        const markerFrom = lineFrom;
        const markerTo = lineFrom + headingMatch[1].length + 1;
        const contentFrom = markerTo;
        const contentTo = lineTo;
        
        if (isRaw) {
            decorations.push({ from: markerFrom, to: markerTo, decoration: headerMark });
        } else {
            if (state === 'hidden') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: hiddenMark });
            } else {
                decorations.push({ from: markerFrom, to: markerTo, decoration: ghostHeadingMarks[level] });
            }
            decorations.push({ from: contentFrom, to: contentTo, decoration: headingMarks[level] });
        }
        
        return decorations;
    }
    
    const blockquoteMatch = line.match(/^(>+)\s*(.*)$/);
    if (blockquoteMatch) {
        const markerFrom = lineFrom;
        const markerTo = lineFrom + blockquoteMatch[1].length + 1;
        const contentFrom = markerTo;
        const contentTo = lineTo;
        
        if (isRaw) {
            decorations.push({ from: markerFrom, to: markerTo, decoration: blockquoteColorMark });
        } else {
            if (state === 'hidden') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: hiddenMark });
            } else {
                decorations.push({ from: markerFrom, to: markerTo, decoration: ghostBlockquoteMark });
            }
            decorations.push({ from: contentFrom, to: contentTo, decoration: blockquoteMark });
        }
    }
    
    const taskMatch = line.match(/^(\s*)(- \[[ x]\])(\s+)(.*)$/);
    if (taskMatch) {
        const indent = taskMatch[1].length;
        const markerFrom = lineFrom + indent;
        const markerTo = markerFrom + taskMatch[2].length;
        
        if (isRaw) {
            // no special decoration in raw mode
        } else {
            if (state === 'hidden') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: hiddenMark });
            } else {
                decorations.push({ from: markerFrom, to: markerTo, decoration: ghostMark });
            }
        }
    } else {
        const ulMatch = line.match(/^(\s*)([-*+])(\s+)(.*)$/);
        if (ulMatch) {
            const indent = ulMatch[1].length;
            const markerFrom = lineFrom + indent;
            const markerTo = markerFrom + 1;
            
            if (isRaw) {
                decorations.push({ from: markerFrom, to: markerTo, decoration: listMarkerMark });
            } else {
                if (state === 'ghost') {
                    decorations.push({ from: markerFrom, to: markerTo, decoration: ghostListMarkerMark });
                } else {
                    decorations.push({ from: markerFrom, to: markerTo, decoration: listMarkerMark });
                }
            }
        }
        
        const olMatch = line.match(/^(\s*)(\d+\.)(\s+)(.*)$/);
        if (olMatch) {
            const indent = olMatch[1].length;
            const markerFrom = lineFrom + indent;
            const markerTo = markerFrom + olMatch[2].length;
            
            if (isRaw) {
                decorations.push({ from: markerFrom, to: markerTo, decoration: listMarkerMark });
            } else {
                if (state === 'ghost') {
                    decorations.push({ from: markerFrom, to: markerTo, decoration: ghostListMarkerMark });
                } else {
                    decorations.push({ from: markerFrom, to: markerTo, decoration: listMarkerMark });
                }
            }
        }
    }
    
    const patterns = [
        { regex: /\*\*\*(.+?)\*\*\*/g, markerLen: 3, styleMark: boldMark, colorMark: boldColorMark, ghostMark: ghostBoldMark },
        { regex: /\*\*(.+?)\*\*/g, markerLen: 2, styleMark: boldMark, colorMark: boldColorMark, ghostMark: ghostBoldMark },
        { regex: /__(.+?)__/g, markerLen: 2, styleMark: boldMark, colorMark: boldColorMark, ghostMark: ghostBoldMark },
        { regex: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, markerLen: 1, styleMark: italicMark, colorMark: italicColorMark, ghostMark: ghostItalicMark },
        { regex: /(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, markerLen: 1, styleMark: italicMark, colorMark: italicColorMark, ghostMark: ghostItalicMark },
        { regex: /~~(.+?)~~/g, markerLen: 2, styleMark: strikeMark, colorMark: strikeColorMark, ghostMark: ghostStrikeMark }
    ];
    
    patterns.forEach(({ regex, markerLen, styleMark, colorMark, ghostMark: patternGhostMark }) => {
        let match;
        const lineRegex = new RegExp(regex.source, regex.flags);
        
        while ((match = lineRegex.exec(line)) !== null) {
            const fullMatch = match[0];
            const matchFrom = lineFrom + match.index;
            const matchTo = matchFrom + fullMatch.length;
            
            const marker1From = matchFrom;
            const marker1To = matchFrom + markerLen;
            const marker2From = matchTo - markerLen;
            const marker2To = matchTo;
            
            const contentFrom = marker1To;
            const contentTo = marker2From;
            
            if (isRaw) {
                decorations.push({ from: marker1From, to: marker1To, decoration: colorMark });
                decorations.push({ from: marker2From, to: marker2To, decoration: colorMark });
                decorations.push({ from: contentFrom, to: contentTo, decoration: plainMark });
            } else {
                if (state === 'hidden') {
                    decorations.push({ from: marker1From, to: marker1To, decoration: hiddenMark });
                    decorations.push({ from: marker2From, to: marker2To, decoration: hiddenMark });
                } else {
                    decorations.push({ from: marker1From, to: marker1To, decoration: patternGhostMark });
                    decorations.push({ from: marker2From, to: marker2To, decoration: patternGhostMark });
                }
                decorations.push({ from: contentFrom, to: contentTo, decoration: styleMark });
            }
        }
    });
    
    const codeRegex = /`([^`]+)`/g;
    let codeMatch;
    while ((codeMatch = codeRegex.exec(line)) !== null) {
        const fullMatch = codeMatch[0];
        const matchFrom = lineFrom + codeMatch.index;
        const matchTo = matchFrom + fullMatch.length;
        
        const backtick1From = matchFrom;
        const backtick1To = matchFrom + 1;
        const backtick2From = matchTo - 1;
        const backtick2To = matchTo;
        
        const contentFrom = backtick1To;
        const contentTo = backtick2From;
        
        if (isRaw) {
            decorations.push({ from: backtick1From, to: backtick1To, decoration: codeColorMark });
            decorations.push({ from: backtick2From, to: backtick2To, decoration: codeColorMark });
            decorations.push({ from: contentFrom, to: contentTo, decoration: codeMark });
        } else {
            if (state === 'hidden') {
                decorations.push({ from: backtick1From, to: backtick1To, decoration: hiddenMark });
                decorations.push({ from: backtick2From, to: backtick2To, decoration: hiddenMark });
            } else {
                decorations.push({ from: backtick1From, to: backtick1To, decoration: ghostCodeMark });
                decorations.push({ from: backtick2From, to: backtick2To, decoration: ghostCodeMark });
            }
            decorations.push({ from: contentFrom, to: contentTo, decoration: codeMark });
        }
    }
    
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(line)) !== null) {
        const fullMatch = linkMatch[0];
        const text = linkMatch[1];
        const url = linkMatch[2];
        const matchFrom = lineFrom + linkMatch.index;
        const matchTo = matchFrom + fullMatch.length;
        
        const bracket1From = matchFrom;
        const bracket1To = matchFrom + 1;
        const bracket2From = matchFrom + 1 + text.length;
        const bracket2To = bracket2From + 1;
        const parenStart = bracket2To;
        const parenEnd = matchTo;
        
        const textFrom = bracket1To;
        const textTo = bracket2From;
        
        if (isRaw) {
            decorations.push({ from: bracket1From, to: bracket1To, decoration: linkColorMark });
            decorations.push({ from: bracket2From, to: bracket2To, decoration: linkColorMark });
            decorations.push({ from: parenStart, to: parenEnd, decoration: linkColorMark });
            decorations.push({ from: textFrom, to: textTo, decoration: linkColorMark });
        } else {
            if (state === 'hidden') {
                decorations.push({ from: bracket1From, to: bracket1To, decoration: hiddenMark });
                decorations.push({ from: bracket2From, to: bracket2To, decoration: hiddenMark });
                decorations.push({ from: parenStart, to: parenEnd, decoration: hiddenMark });
            } else {
                decorations.push({ from: bracket1From, to: bracket1To, decoration: ghostLinkMark });
                decorations.push({ from: bracket2From, to: bracket2To, decoration: ghostLinkMark });
                decorations.push({ from: parenStart, to: parenEnd, decoration: ghostLinkMark });
            }
            decorations.push({ from: textFrom, to: textTo, decoration: linkMark });
        }
    }
    
    const emojiRegex = /:([a-z0-9_+-]+):/gi;
    let emojiMatch;
    while ((emojiMatch = emojiRegex.exec(line)) !== null) {
        const matchFrom = lineFrom + emojiMatch.index;
        const matchTo = matchFrom + emojiMatch[0].length;
        
        if (isRaw) {
            // no decoration in raw mode
        } else {
            if (state === 'hidden') {
                decorations.push({ from: matchFrom, to: matchTo, decoration: hiddenMark });
            } else {
                decorations.push({ from: matchFrom, to: matchTo, decoration: ghostMark });
            }
        }
    }
    
    const inlineMathRegex = /\$([^\$\n]+)\$/g;
    let mathMatch;
    while ((mathMatch = inlineMathRegex.exec(line)) !== null) {
        const matchFrom = lineFrom + mathMatch.index;
        const matchTo = matchFrom + mathMatch[0].length;
        const dollar1From = matchFrom;
        const dollar1To = matchFrom + 1;
        const dollar2From = matchTo - 1;
        const dollar2To = matchTo;
        
        if (isRaw) {
            // no decoration in raw mode
        } else {
            if (state === 'hidden') {
                decorations.push({ from: dollar1From, to: dollar1To, decoration: hiddenMark });
                decorations.push({ from: dollar2From, to: dollar2To, decoration: hiddenMark });
            } else {
                decorations.push({ from: dollar1From, to: dollar1To, decoration: ghostMark });
                decorations.push({ from: dollar2From, to: dollar2To, decoration: ghostMark });
            }
        }
    }
    
    return decorations;
}

export function buildDecorations(view) {
    const { state } = view;
    const mode = state.field(renderModeField);
    
    const builder = new RangeSetBuilder();
    const { doc, selection } = state;
    const cursorPos = selection.main.head;
    
    const decorations = [];
    
    for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        const lineDecorations = parseLineDecorations(line.text, line.from, cursorPos, mode);
        decorations.push(...lineDecorations);
    }
    
    decorations.sort((a, b) => a.from - b.from || b.to - a.to);
    
    let pos = 0;
    for (const dec of decorations) {
        if (dec && dec.decoration && dec.from >= pos && dec.from < dec.to) {
            builder.add(dec.from, dec.to, dec.decoration);
            pos = dec.to;
        }
    }
    
    return builder.finish();
}

export const decorationExtension = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = buildDecorations(view);
    }
    
    update(update) {
        if (update.docChanged || update.viewportChanged || update.selectionSet || update.transactions.some(tr => tr.effects.some(e => e.is(setRenderMode)))) {
            this.decorations = buildDecorations(update.view);
        }
    }
}, {
    decorations: v => v.decorations
});
