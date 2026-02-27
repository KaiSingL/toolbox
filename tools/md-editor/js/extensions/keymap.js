import { keymap } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

function wrapSelection(editor, before, after) {
    const { state } = editor;
    const { selection } = state;
    
    const changes = [];
    const newSelection = [];
    
    for (const range of selection.ranges) {
        const selectedText = state.sliceDoc(range.from, range.to);
        
        if (range.empty) {
            changes.push({ from: range.from, insert: before + after });
            newSelection.push(EditorSelection.cursor(range.from + before.length));
        } else {
            changes.push(
                { from: range.from, insert: before },
                { from: range.to, insert: after }
            );
            newSelection.push(EditorSelection.range(range.from + before.length, range.to + before.length));
        }
    }
    
    editor.dispatch({
        changes,
        selection: EditorSelection.create(newSelection)
    });
    
    editor.focus();
}

function toggleFormat(editor, marker) {
    const { state } = editor;
    const { selection } = state;
    
    const changes = [];
    const newSelection = [];
    
    for (const range of selection.ranges) {
        const from = range.from;
        const to = range.to;
        const selectedText = state.sliceDoc(from, to);
        
        const beforeText = state.sliceDoc(Math.max(0, from - marker.length), from);
        const afterText = state.sliceDoc(to, Math.min(state.doc.length, to + marker.length));
        
        if (beforeText === marker && afterText === marker) {
            changes.push(
                { from: from - marker.length, to: from, insert: '' },
                { from: to, to: to + marker.length, insert: '' }
            );
            newSelection.push(EditorSelection.range(from - marker.length, to - marker.length));
        } else if (selectedText.startsWith(marker) && selectedText.endsWith(marker) && selectedText.length >= marker.length * 2) {
            changes.push(
                { from, to: from + marker.length, insert: '' },
                { from: to - marker.length, to, insert: '' }
            );
            newSelection.push(EditorSelection.range(from, to - marker.length * 2));
        } else if (range.empty) {
            changes.push({ from, insert: marker + marker });
            newSelection.push(EditorSelection.cursor(from + marker.length));
        } else {
            changes.push(
                { from, insert: marker },
                { from: to, insert: marker }
            );
            newSelection.push(EditorSelection.range(from + marker.length, to + marker.length));
        }
    }
    
    editor.dispatch({
        changes,
        selection: EditorSelection.create(newSelection)
    });
    
    editor.focus();
}

function insertLink(editor) {
    const { state } = editor;
    const { selection } = state;
    
    const changes = [];
    const newSelection = [];
    
    for (const range of selection.ranges) {
        const selectedText = state.sliceDoc(range.from, range.to);
        
        if (range.empty) {
            changes.push({ from: range.from, insert: '[text](url)' });
            newSelection.push(EditorSelection.range(range.from + 1, range.from + 5));
        } else {
            changes.push(
                { from: range.from, insert: '[' },
                { from: range.to, insert: '](url)' }
            );
            newSelection.push(EditorSelection.range(range.to + 3, range.to + 6));
        }
    }
    
    editor.dispatch({
        changes,
        selection: EditorSelection.create(newSelection)
    });
    
    editor.focus();
}

function insertImage(editor) {
    const { state } = editor;
    const { selection } = state;
    
    const changes = [];
    const newSelection = [];
    
    for (const range of selection.ranges) {
        if (range.empty) {
            changes.push({ from: range.from, insert: '![alt](url)' });
            newSelection.push(EditorSelection.range(range.from + 2, range.from + 5));
        } else {
            const selectedText = state.sliceDoc(range.from, range.to);
            changes.push(
                { from: range.from, insert: '![' },
                { from: range.to, insert: '](url)' }
            );
            newSelection.push(EditorSelection.range(range.to + 3, range.to + 6));
        }
    }
    
    editor.dispatch({
        changes,
        selection: EditorSelection.create(newSelection)
    });
    
    editor.focus();
}

function insertCodeBlock(editor) {
    const { state } = editor;
    const { selection } = state;
    const from = selection.main.from;
    
    editor.dispatch({
        changes: { from, insert: '```\ncode\n```\n' },
        selection: EditorSelection.cursor(from + 4)
    });
    
    editor.focus();
}

export function createKeymap(editor, fileOps) {
    return keymap.of([
        {
            key: 'Mod-b',
            run: () => {
                toggleFormat(editor, '**');
                return true;
            }
        },
        {
            key: 'Mod-i',
            run: () => {
                toggleFormat(editor, '*');
                return true;
            }
        },
        {
            key: 'Mod-s',
            run: () => {
                fileOps.save();
                return true;
            }
        },
        {
            key: 'Mod-o',
            run: () => {
                fileOps.open();
                return true;
            }
        },
        {
            key: 'Mod-Shift-n',
            run: () => {
                fileOps.newFile();
                return true;
            }
        },
        {
            key: 'Mod-k',
            run: () => {
                insertLink(editor);
                return true;
            }
        },
        {
            key: 'Mod-Shift-k',
            run: () => {
                insertImage(editor);
                return true;
            }
        },
        {
            key: 'Mod-`',
            run: () => {
                toggleFormat(editor, '`');
                return true;
            }
        },
        {
            key: 'Mod-Shift-`',
            run: () => {
                insertCodeBlock(editor);
                return true;
            }
        },
        {
            key: 'Mod-\\',
            run: () => {
                fileOps.toggleMode();
                return true;
            }
        },
        {
            key: 'Tab',
            run: () => {
                const { state } = editor;
                const { selection } = state;
                
                const changes = [];
                for (const range of selection.ranges) {
                    changes.push({ from: range.from, insert: '    ' });
                }
                
                editor.dispatch({
                    changes,
                    selection: EditorSelection.create(
                        selection.ranges.map(r => EditorSelection.cursor(r.from + 4))
                    )
                });
                
                return true;
            }
        }
    ]);
}

export { toggleFormat, insertLink, insertImage, insertCodeBlock };
