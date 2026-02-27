import { EditorView } from '@codemirror/view';

export const markdownTheme = EditorView.baseTheme({
    // Base styles (apply to all modes)
    '&': {
        backgroundColor: 'var(--bg-secondary, #111111)',
        color: 'var(--text-primary, #e0e0e0)',
        height: '100%'
    },
    '.cm-content': {
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        fontSize: '15px',
        lineHeight: '1.7',
        caretColor: 'var(--accent, #cac8f4)',
        padding: '24px 0'
    },
    '.cm-line': {
        padding: '0 24px'
    },
    '.cm-cursor': {
        borderLeftColor: 'var(--accent, #cac8f4)',
        borderLeftWidth: '2px'
    },
    '.cm-selectionBackground': {
        backgroundColor: 'rgba(202, 200, 244, 0.35) !important'
    },
    '.cm-focused .cm-selectionBackground': {
        backgroundColor: 'rgba(202, 200, 244, 0.5) !important'
    },
    '.cm-gutters': {
        backgroundColor: 'var(--bg-primary, #050505)',
        borderRight: '1px solid var(--border-color, #333)',
        color: 'var(--text-muted, #666)'
    },
    '.cm-activeLineGutter': {
        backgroundColor: 'var(--bg-secondary, #111111)',
        color: 'var(--text-primary, #e0e0e0)'
    },
    '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)'
    },
    '.cm-foldPlaceholder': {
        backgroundColor: 'var(--accent, #cac8f4)',
        color: 'var(--bg-primary, #050505)',
        border: 'none',
        padding: '0 4px',
        borderRadius: '2px'
    },
    '.cm-foldGutter': {
        width: '16px !important'
    },
    '.cm-foldGutter .cm-gutterElement': {
        cursor: 'pointer !important',
        color: 'var(--text-muted, #666) !important',
        fontSize: '16px !important',
        lineHeight: '1.7 !important',
        padding: '0 2px !important',
        transition: 'color 0.15s ease, transform 0.15s ease'
    },
    '.cm-foldGutter .cm-gutterElement:hover': {
        color: 'var(--accent, #cac8f4) !important'
    },
    '.cm-scroller': {
        overflow: 'auto'
    },
    '.cm-tooltip': {
        background: 'var(--bg-secondary, #111111) !important',
        border: '1px solid var(--border-color, #333) !important',
        borderRadius: '2px !important',
        color: 'var(--text-primary, #e0e0e0) !important',
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace) !important',
        fontSize: '12px !important'
    },
    '.cm-tooltip-autocomplete': {
        padding: '4px !important'
    },
    '.cm-tooltip-autocomplete li': {
        padding: '4px 8px !important',
        borderRadius: '2px !important'
    },
    '.cm-tooltip-autocomplete li[aria-selected="true"]': {
        background: 'var(--accent, #cac8f4) !important',
        color: 'var(--bg-primary, #050505) !important'
    },
    
    // Hidden mark (used in rendered mode to hide syntax markers)
    '.cm-md-hidden': {
        fontSize: '0 !important',
        display: 'inline-block !important',
        width: '0 !important',
        overflow: 'hidden !important'
    },
    
    // Base ghost class (fallback for elements without dedicated ghost class)
    '.cm-md-ghost': {
        opacity: '0.55 !important',
        fontWeight: 'normal !important',
        fontStyle: 'normal !important',
        textDecoration: 'none !important'
    },
    
    // Plain text reset (used in raw mode for content)
    '.cm-md-plain': {
        fontWeight: 'normal !important',
        fontStyle: 'normal !important',
        textDecoration: 'none !important'
    },
    
    // ========================================
    // RENDERED MODE STYLES
    // ========================================
    '&.mode-rendered .cm-md-bold': {
        fontWeight: '700 !important'
    },
    '&.mode-rendered .cm-md-italic': {
        fontStyle: 'italic !important',
        color: '#4ec9b0 !important'
    },
    '&.mode-rendered .cm-md-strike': {
        textDecoration: 'line-through !important'
    },
    '&.mode-rendered .cm-md-code': {
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace) !important',
        background: 'rgba(152, 195, 121, 0.15) !important',
        color: '#98c379 !important',
        padding: '2px 6px !important',
        borderRadius: '2px !important',
        fontSize: '0.9em !important'
    },
    '&.mode-rendered .cm-md-link': {
        color: '#ffa657 !important',
        textDecoration: 'underline !important',
        cursor: 'pointer !important'
    },
    '&.mode-rendered .cm-md-link:hover': {
        textDecoration: 'none !important'
    },
    '&.mode-rendered .cm-md-blockquote': {
        borderLeft: '3px solid #6a9955 !important',
        paddingLeft: '16px !important',
        color: '#6a9955 !important',
        fontStyle: 'italic !important'
    },
    '&.mode-rendered .cm-md-list-marker': {
        color: 'var(--accent, #cac8f4) !important'
    },
    '&.mode-rendered .cm-md-h1': {
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '2em !important',
        fontWeight: '700 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '&.mode-rendered .cm-md-h2': {
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '1.5em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '&.mode-rendered .cm-md-h3': {
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '1.25em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '&.mode-rendered .cm-md-h4': {
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '1.1em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '&.mode-rendered .cm-md-h5': {
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '1em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '&.mode-rendered .cm-md-h6': {
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '0.9em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#888888 !important'
    },
    '&.mode-rendered .cm-md-header': {
        color: '#cac8f4 !important'
    },
    
    // ========================================
    // RAW MODE STYLES (color only, no layout changes)
    // ========================================
    '&.mode-raw .cm-md-bold': {
        color: '#ffd700 !important'
    },
    '&.mode-raw .cm-md-bold-color': {
        color: '#ffd700 !important',
        fontWeight: 'normal !important'
    },
    '&.mode-raw .cm-md-italic': {
        color: '#4ec9b0 !important'
    },
    '&.mode-raw .cm-md-italic-color': {
        color: '#4ec9b0 !important',
        fontStyle: 'normal !important'
    },
    '&.mode-raw .cm-md-strike': {
        color: '#f14c4c !important'
    },
    '&.mode-raw .cm-md-strike-color': {
        color: '#f14c4c !important',
        textDecoration: 'none !important'
    },
    '&.mode-raw .cm-md-code': {
        color: '#98c379 !important',
        background: 'transparent !important',
        padding: '0 !important'
    },
    '&.mode-raw .cm-md-code-color': {
        color: '#98c379 !important',
        background: 'transparent !important',
        padding: '0 !important'
    },
    '&.mode-raw .cm-md-link': {
        color: '#ffa657 !important',
        textDecoration: 'none !important'
    },
    '&.mode-raw .cm-md-link-color': {
        color: '#ffa657 !important',
        textDecoration: 'none !important'
    },
    '&.mode-raw .cm-md-blockquote': {
        color: '#6a9955 !important',
        fontStyle: 'normal !important',
        borderLeft: 'none !important',
        paddingLeft: '0 !important'
    },
    '&.mode-raw .cm-md-blockquote-color': {
        color: '#6a9955 !important',
        fontStyle: 'normal !important',
        borderLeft: 'none !important',
        paddingLeft: '0 !important'
    },
    '&.mode-raw .cm-md-list-marker': {
        color: 'var(--accent, #cac8f4) !important'
    },
    '&.mode-raw .cm-md-h1, &.mode-raw .cm-md-h2, &.mode-raw .cm-md-h3, &.mode-raw .cm-md-h4, &.mode-raw .cm-md-h5': {
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace) !important',
        fontSize: '1em !important',
        fontWeight: 'normal !important',
        lineHeight: '1.7 !important',
        color: '#cac8f4 !important'
    },
    '&.mode-raw .cm-md-h6': {
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace) !important',
        fontSize: '1em !important',
        fontWeight: 'normal !important',
        lineHeight: '1.7 !important',
        color: '#888888 !important'
    },
    '&.mode-raw .cm-md-header': {
        color: '#cac8f4 !important'
    },
    
    // ========================================
    // DEDICATED GHOST CLASSES (single class per type)
    // ========================================
    '.cm-md-ghost-bold': {
        opacity: '0.55 !important',
        color: '#ffd700 !important',
        fontWeight: 'normal !important'
    },
    '.cm-md-ghost-italic': {
        opacity: '0.55 !important',
        color: '#4ec9b0 !important',
        fontStyle: 'normal !important'
    },
    '.cm-md-ghost-strike': {
        opacity: '0.55 !important',
        color: '#f14c4c !important',
        textDecoration: 'none !important'
    },
    '.cm-md-ghost-code': {
        opacity: '0.55 !important',
        color: '#98c379 !important',
        background: 'transparent !important',
        padding: '0 !important'
    },
    '.cm-md-ghost-link': {
        opacity: '0.55 !important',
        color: '#ffa657 !important',
        textDecoration: 'none !important'
    },
    '.cm-md-ghost-blockquote': {
        opacity: '0.55 !important',
        color: '#6a9955 !important',
        fontStyle: 'normal !important',
        borderLeft: 'none !important',
        paddingLeft: '0 !important'
    },
    '.cm-md-ghost-list-marker': {
        opacity: '0.55 !important',
        color: 'var(--accent, #cac8f4) !important'
    },
    '.cm-md-ghost-h1': {
        opacity: '0.55 !important',
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '2em !important',
        fontWeight: '700 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '.cm-md-ghost-h2': {
        opacity: '0.55 !important',
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '1.5em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '.cm-md-ghost-h3': {
        opacity: '0.55 !important',
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '1.25em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '.cm-md-ghost-h4': {
        opacity: '0.55 !important',
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '1.1em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '.cm-md-ghost-h5': {
        opacity: '0.55 !important',
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '1em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#cac8f4 !important'
    },
    '.cm-md-ghost-h6': {
        opacity: '0.55 !important',
        fontFamily: '"Clash Display", sans-serif !important',
        fontSize: '0.9em !important',
        fontWeight: '600 !important',
        lineHeight: '1.3 !important',
        color: '#888888 !important'
    },
    '.cm-md-ghost-header': {
        opacity: '0.55 !important',
        color: '#cac8f4 !important'
    },
    
    // ========================================
    // SHARED STYLES (widgets, tables, etc.)
    // ========================================
    '.cm-md-link-url': {
        fontSize: '0 !important',
        display: 'inline-block',
        width: '0',
        overflow: 'hidden'
    },
    '.cm-md-hr': {
        border: 'none !important',
        borderTop: '1px solid var(--border-color, #333) !important',
        display: 'block !important',
        margin: '8px 0 !important',
        height: '0 !important'
    },
    '.cm-md-checkbox': {
        marginRight: '8px !important',
        accentColor: 'var(--accent, #cac8f4)'
    },
    '.cm-md-math': {
        fontFamily: '"KaTeX_Main", "Times New Roman", serif !important'
    },
    '.cm-md-mermaid': {
        background: 'rgba(255, 255, 255, 0.02) !important',
        border: '1px solid var(--border-color, #333) !important',
        borderRadius: '2px !important',
        padding: '16px !important',
        margin: '8px 0 !important',
        textAlign: 'center !important',
        overflowX: 'auto !important',
        display: 'block !important'
    },
    '.cm-md-mermaid svg': {
        maxWidth: '100%',
        height: 'auto'
    },
    '.cm-md-table': {
        borderCollapse: 'collapse !important',
        margin: '12px 0 !important',
        display: 'table !important',
        width: '100% !important',
        border: '1px solid var(--border-color, #333) !important',
        borderRadius: '2px !important',
        overflow: 'hidden !important'
    },
    '.cm-md-table-row': {
        display: 'table-row !important'
    },
    '.cm-md-table-cell': {
        border: '1px solid var(--border-color, #333) !important',
        padding: '8px 12px !important',
        display: 'table-cell !important',
        verticalAlign: 'middle !important'
    },
    '.cm-md-table-header': {
        background: 'rgba(202, 200, 244, 0.1) !important',
        fontWeight: '600 !important',
        color: 'var(--accent, #cac8f4) !important',
        textAlign: 'left !important'
    },
    '.cm-md-emoji': {
        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif !important'
    },
    '.cm-md-codeblock': {
        display: 'block !important',
        margin: '8px 0 !important',
        background: 'rgba(0, 0, 0, 0.3) !important',
        border: '1px solid var(--border-color, #333) !important',
        borderRadius: '2px !important',
        padding: '16px !important',
        overflowX: 'auto !important'
    },
    '.cm-md-codeblock pre': {
        margin: '0 !important',
        padding: '0 !important',
        background: 'transparent !important'
    },
    '.cm-md-image': {
        maxWidth: '100%',
        height: 'auto',
        border: '1px solid var(--border-color, #333)',
        borderRadius: '2px',
        margin: '8px 0',
        display: 'block'
    },
    
    // CodeMirror built-in syntax highlighting overrides
    '.cm-header': {
        color: '#ffffff !important',
        fontWeight: '600 !important'
    },
    '.cm-header-1': {
        fontSize: '1.6em !important',
        fontWeight: '700 !important'
    },
    '.cm-header-2': {
        fontSize: '1.4em !important'
    },
    '.cm-header-3': {
        fontSize: '1.2em !important'
    },
    '.cm-header-4': {
        fontSize: '1.1em !important'
    },
    '.cm-header-6': {
        color: '#888888 !important'
    },
    '.cm-strong': {
        fontWeight: '700 !important'
    },
    '.cm-em': {
        color: '#4ec9b0 !important'
    },
    '.cm-strikethrough': {
        color: '#f14c4c !important'
    },
    '.cm-link': {
        color: '#ffa657 !important'
    },
    '.cm-url': {
        color: '#888888 !important'
    },
    '.cm-monospace': {
        color: '#98c379 !important'
    },
    '.cm-list': {
        color: '#cac8f4 !important'
    },
    '.cm-quote': {
        color: '#6a9955 !important'
    },
    '.cm-meta': {
        color: '#888888 !important'
    },
    
    // Generated class overrides (ͼ-prefixed)
    '.cm-content .ͼ5': {
        color: '#888888 !important'
    },
    '.cm-content .ͼ7': {
        color: '#cac8f4 !important'
    },
    '.cm-content .ͼ8': {
        fontWeight: '700 !important'
    },
    '.cm-content .ͼ9': {
        color: '#4ec9b0 !important',
        fontStyle: 'normal !important',
        fontWeight: 'normal !important'
    },
    '.cm-content .ͼa': {
        color: '#98c379 !important',
        textDecoration: 'none !important'
    },
    '.cm-content .ͼb': {
        color: '#ffa657 !important'
    },
    '.cm-content .ͼc': {
        color: '#6a9955 !important',
        fontStyle: 'normal !important'
    },
    '.cm-content .ͼe': {
        color: '#ffa657 !important'
    }
});
