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

const ghostBoldMark = Decoration.mark({ class: 'cm-md-ghost cm-md-bold-color' });
const ghostItalicMark = Decoration.mark({ class: 'cm-md-ghost cm-md-italic-color' });
const ghostStrikeMark = Decoration.mark({ class: 'cm-md-ghost cm-md-strike-color' });
const ghostCodeMark = Decoration.mark({ class: 'cm-md-ghost cm-md-code-color' });
const ghostLinkMark = Decoration.mark({ class: 'cm-md-ghost cm-md-link-color' });
const ghostBlockquoteMark = Decoration.mark({ class: 'cm-md-ghost cm-md-blockquote-color' });
const ghostListMarkerMark = Decoration.mark({ class: 'cm-md-ghost cm-md-list-marker' });
const ghostHeaderMark = Decoration.mark({ class: 'cm-md-ghost cm-md-header' });
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
    1: Decoration.mark({ class: 'cm-md-ghost cm-md-h1' }),
    2: Decoration.mark({ class: 'cm-md-ghost cm-md-h2' }),
    3: Decoration.mark({ class: 'cm-md-ghost cm-md-h3' }),
    4: Decoration.mark({ class: 'cm-md-ghost cm-md-h4' }),
    5: Decoration.mark({ class: 'cm-md-ghost cm-md-h5' }),
    6: Decoration.mark({ class: 'cm-md-ghost cm-md-h6' })
};

function getVisibilityState(cursorPos, from, to, lineFrom, lineTo) {
    const cursorInRegion = cursorPos >= from && cursorPos <= to;
    const cursorOnLine = cursorPos >= lineFrom && cursorPos <= lineTo;
    
    if (cursorInRegion) {
        return 'raw';
    } else if (cursorOnLine) {
        return 'ghost';
    }
    return 'hidden';
}

function parseLineDecorations(line, lineFrom, cursorPos, mode) {
    const decorations = [];
    const lineTo = lineFrom + line.length;
    const isRaw = mode === 'raw';
    
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
        const level = headingMatch[1].length;
        const markerFrom = lineFrom;
        const markerTo = lineFrom + headingMatch[1].length + 1;
        const contentFrom = markerTo;
        const contentTo = lineTo;
        
        const state = getVisibilityState(cursorPos, markerFrom, markerTo, lineFrom, lineTo);
        
        if (isRaw) {
            // Raw mode: # and content both stay normal size
        } else {
            if (state === 'hidden') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: hiddenMark });
            } else if (state === 'ghost') {
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
        
        const state = getVisibilityState(cursorPos, markerFrom, markerTo, lineFrom, lineTo);
        
        if (isRaw) {
            if (state === 'ghost') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: ghostBlockquoteMark });
            } else {
                decorations.push({ from: markerFrom, to: markerTo, decoration: blockquoteColorMark });
            }
        } else {
            if (state === 'hidden') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: hiddenMark });
            } else if (state === 'ghost') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: ghostMark });
            }
            decorations.push({ from: contentFrom, to: contentTo, decoration: blockquoteMark });
        }
        
        return decorations;
    }
    
    const taskMatch = line.match(/^(\s*)(- \[[ x]\])(\s+)(.*)$/);
    if (taskMatch) {
        const indent = taskMatch[1].length;
        const markerFrom = lineFrom + indent;
        const markerTo = markerFrom + taskMatch[2].length;
        
        const state = getVisibilityState(cursorPos, markerFrom, markerTo, lineFrom, lineTo);
        
        if (isRaw) {
            if (state === 'ghost') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: ghostMark });
            }
        } else {
            if (state === 'hidden') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: hiddenMark });
            } else if (state === 'ghost') {
                decorations.push({ from: markerFrom, to: markerTo, decoration: ghostMark });
            }
        }
    } else {
        const ulMatch = line.match(/^(\s*)([-*+])(\s+)(.*)$/);
        if (ulMatch) {
            const indent = ulMatch[1].length;
            const markerFrom = lineFrom + indent;
            const markerTo = markerFrom + 1;
            
            const state = getVisibilityState(cursorPos, markerFrom, markerTo, lineFrom, lineTo);
            
            if (isRaw) {
                if (state === 'ghost') {
                    decorations.push({ from: markerFrom, to: markerTo, decoration: ghostListMarkerMark });
                } else {
                    decorations.push({ from: markerFrom, to: markerTo, decoration: listMarkerMark });
                }
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
            
            const state = getVisibilityState(cursorPos, markerFrom, markerTo, lineFrom, lineTo);
            
            if (isRaw) {
                if (state === 'ghost') {
                    decorations.push({ from: markerFrom, to: markerTo, decoration: ghostListMarkerMark });
                } else {
                    decorations.push({ from: markerFrom, to: markerTo, decoration: listMarkerMark });
                }
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
            
            const state1 = getVisibilityState(cursorPos, marker1From, marker1To, lineFrom, lineTo);
            const state2 = getVisibilityState(cursorPos, marker2From, marker2To, lineFrom, lineTo);
            
            const contentFrom = marker1To;
            const contentTo = marker2From;
            
            if (isRaw) {
                if (state1 === 'ghost') {
                    decorations.push({ from: marker1From, to: marker1To, decoration: patternGhostMark });
                } else {
                    decorations.push({ from: marker1From, to: marker1To, decoration: colorMark });
                }
                if (state2 === 'ghost') {
                    decorations.push({ from: marker2From, to: marker2To, decoration: patternGhostMark });
                } else {
                    decorations.push({ from: marker2From, to: marker2To, decoration: colorMark });
                }
                decorations.push({ from: contentFrom, to: contentTo, decoration: plainMark });
            } else {
                if (state1 === 'hidden') {
                    decorations.push({ from: marker1From, to: marker1To, decoration: hiddenMark });
                } else if (state1 === 'ghost') {
                    decorations.push({ from: marker1From, to: marker1To, decoration: patternGhostMark });
                } else {
                    decorations.push({ from: marker1From, to: marker1To, decoration: colorMark });
                }
                
                if (state2 === 'hidden') {
                    decorations.push({ from: marker2From, to: marker2To, decoration: hiddenMark });
                } else if (state2 === 'ghost') {
                    decorations.push({ from: marker2From, to: marker2To, decoration: patternGhostMark });
                } else {
                    decorations.push({ from: marker2From, to: marker2To, decoration: colorMark });
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
        
        const state1 = getVisibilityState(cursorPos, backtick1From, backtick1To, lineFrom, lineTo);
        const state2 = getVisibilityState(cursorPos, backtick2From, backtick2To, lineFrom, lineTo);
        
        const contentFrom = backtick1To;
        const contentTo = backtick2From;
        
        if (isRaw) {
            if (state1 === 'ghost') {
                decorations.push({ from: backtick1From, to: backtick1To, decoration: ghostCodeMark });
            } else {
                decorations.push({ from: backtick1From, to: backtick1To, decoration: codeColorMark });
            }
            if (state2 === 'ghost') {
                decorations.push({ from: backtick2From, to: backtick2To, decoration: ghostCodeMark });
            } else {
                decorations.push({ from: backtick2From, to: backtick2To, decoration: codeColorMark });
            }
            decorations.push({ from: contentFrom, to: contentTo, decoration: codeMark });
        } else {
            if (state1 === 'hidden') {
                decorations.push({ from: backtick1From, to: backtick1To, decoration: hiddenMark });
            } else if (state1 === 'ghost') {
                decorations.push({ from: backtick1From, to: backtick1To, decoration: ghostCodeMark });
            } else {
                decorations.push({ from: backtick1From, to: backtick1To, decoration: codeMark });
            }
            
            if (state2 === 'hidden') {
                decorations.push({ from: backtick2From, to: backtick2To, decoration: hiddenMark });
            } else if (state2 === 'ghost') {
                decorations.push({ from: backtick2From, to: backtick2To, decoration: ghostCodeMark });
            } else {
                decorations.push({ from: backtick2From, to: backtick2To, decoration: codeMark });
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
        
        const state = getVisibilityState(cursorPos, bracket1From, parenEnd, lineFrom, lineTo);
        
        if (isRaw) {
            if (state === 'ghost') {
                decorations.push({ from: bracket1From, to: bracket1To, decoration: ghostLinkMark });
                decorations.push({ from: bracket2From, to: bracket2To, decoration: ghostLinkMark });
                decorations.push({ from: parenStart, to: parenEnd, decoration: ghostLinkMark });
            } else {
                decorations.push({ from: bracket1From, to: bracket1To, decoration: linkColorMark });
                decorations.push({ from: bracket2From, to: bracket2To, decoration: linkColorMark });
                decorations.push({ from: parenStart, to: parenEnd, decoration: linkColorMark });
            }
            decorations.push({ from: textFrom, to: textTo, decoration: linkColorMark });
        } else {
            if (state === 'hidden') {
                decorations.push({ from: bracket1From, to: bracket1To, decoration: hiddenMark });
                decorations.push({ from: bracket2From, to: bracket2To, decoration: hiddenMark });
                decorations.push({ from: parenStart, to: parenEnd, decoration: hiddenMark });
            } else if (state === 'ghost') {
                decorations.push({ from: bracket1From, to: bracket1To, decoration: ghostLinkMark });
                decorations.push({ from: bracket2From, to: bracket2To, decoration: ghostLinkMark });
                decorations.push({ from: parenStart, to: parenEnd, decoration: ghostLinkMark });
            } else {
                decorations.push({ from: bracket1From, to: bracket1To, decoration: linkMark });
                decorations.push({ from: bracket2From, to: bracket2To, decoration: linkMark });
                decorations.push({ from: parenStart, to: parenEnd, decoration: linkMark });
            }
            
            decorations.push({ from: textFrom, to: textTo, decoration: linkMark });
        }
    }
    
    const emojiRegex = /:([a-z0-9_+-]+):/gi;
    let emojiMatch;
    while ((emojiMatch = emojiRegex.exec(line)) !== null) {
        const matchFrom = lineFrom + emojiMatch.index;
        const matchTo = matchFrom + emojiMatch[0].length;
        
        const state = getVisibilityState(cursorPos, matchFrom, matchTo, lineFrom, lineTo);
        
        if (isRaw) {
            if (state === 'ghost') {
                decorations.push({ from: matchFrom, to: matchTo, decoration: ghostMark });
            }
        } else {
            if (state === 'hidden') {
                decorations.push({ from: matchFrom, to: matchTo, decoration: hiddenMark });
            } else if (state === 'ghost') {
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
        
        const state1 = getVisibilityState(cursorPos, dollar1From, dollar1To, lineFrom, lineTo);
        const state2 = getVisibilityState(cursorPos, dollar2From, dollar2To, lineFrom, lineTo);
        
        if (isRaw) {
            if (state1 === 'ghost') {
                decorations.push({ from: dollar1From, to: dollar1To, decoration: ghostMark });
            }
            if (state2 === 'ghost') {
                decorations.push({ from: dollar2From, to: dollar2To, decoration: ghostMark });
            }
        } else {
            if (state1 === 'hidden') {
                decorations.push({ from: dollar1From, to: dollar1To, decoration: hiddenMark });
            } else if (state1 === 'ghost') {
                decorations.push({ from: dollar1From, to: dollar1To, decoration: ghostMark });
            }
            
            if (state2 === 'hidden') {
                decorations.push({ from: dollar2From, to: dollar2To, decoration: hiddenMark });
            } else if (state2 === 'ghost') {
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
