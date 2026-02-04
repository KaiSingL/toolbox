# Web Tools Hub - Agent Guidelines

## Build/Run/Test Commands

This project uses static HTML/CSS/JavaScript with no build process, linting tools, or automated testing framework. All tools run directly in the browser with no compilation step.

- **Run locally:** `python3 -m http.server` (serves on http://localhost:8000) or `npx http-server`
- **Deploy to GitHub Pages:** Push to `main` branch and enable GitHub Pages in repository settings
- **No build commands required** - tools run directly in browser
- **Performance testing:** `npx lighthouse http://localhost:8000/index.html --output=json --output-path=lighthouse-result.json --quiet`
- **Performance targets:** Aim for 90+ Lighthouse Performance score, <2.5s LCP, <300KB bundle size
- **Manual testing:** Open tool in browser after running local server. Test functionality, responsive design, and edge cases manually.
- **Running a single test:** Navigate to `http://localhost:8000/tools/tool-name/` and verify expected behavior.

## Cursor Rules & Copilot Instructions

No Cursor rules (.cursor/rules or .cursorrules) or Copilot rules (.github/copilot-instructions.md) are configured for this repository. Follow the guidelines below for consistent code generation.

## Git Workflow

- **Commit message format:** `type(tool-name): brief description` (e.g., `fix(log-reader): use pre-built lineIndex`)
- **Types:** feat, fix, style, refactor, docs, chore
- **Commit frequency:** Commit when user says so
- **Never force push:** Warn user if force push is requested
- **Branch:** Work on `main` branch directly

## Design System

### Neo-Brutalist Style (Current)
This project uses a neo-brutalist design system defined in `assets/css/brutalist.min.css`:
- **Background:** #050505 (near-black)
- **Surface:** #111111
- **Accent:** #cac8f4 (lavender)
- **Fonts:** Clash Display (headings), JetBrains Mono (body)
- **Borders:** Visible 1-3px borders, no/minimal border-radius (2px max)
- **Shadows:** Sharp offset shadows, no blur

### Legacy Tailwind Style (Deprecated)
Older tools may use Tailwind CSS. Do not use Tailwind for new features - use brutalist.css.

## Code Style Guidelines

### General Principles
- **Readability First:** Code should be self-documenting with clear variable names and structure
- **Consistency:** Follow existing patterns in the codebase
- **Performance:** Optimize for browser execution, minimize DOM manipulations
- **Security:** Never store or transmit user data; all processing client-side
- **Accessibility:** Ensure keyboard navigation and screen reader compatibility

### JavaScript Conventions
- **Variables:** Use `const` for immutable, `let` for mutable. Avoid `var`
- **Naming:** camelCase for variables/functions, kebab-case for IDs
- **Functions:** Keep small (<20 lines), descriptive names, single responsibility
- **DOM:** Use `document.getElementById()` for single elements
- **Events:** Use `.addEventListener()` with arrow functions, avoid inline handlers
- **Async:** Use async/await, avoid `.then()` chains
- **Async Abort:** Use AbortController for cancellable async operations (see log-reader pattern)
- **Comments:** Section comments only, avoid obvious comments

### Async Patterns (Log Reader Example)
When handling large files or long-running operations:
```javascript
let abortController = null;

async function startOperation() {
    if (abortController) {
        abortController.abort();
    }
    abortController = new AbortController();
    
    try {
        for await (const chunk of stream) {
            if (abortController.signal.aborted) {
                throw new Error('AbortError');
            }
            // process chunk
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Operation error:', error);
        }
    }
}
```

### HTML Structure
- Use semantic HTML5 elements (header, main, footer, section, article)
- Include proper meta tags (charset, viewport, og: tags for social sharing)
- Link favicon relative to root: `<link rel="icon" type="image/png" sizes="32x32" href="../../assets/icons/icon.png">`
- Load brutalist.min.css: `<link rel="stylesheet" href="../../assets/css/brutalist.min.css">`
- Keep scripts at end of body tag for performance
- Use data attributes for JS hooks: `<div data-component="drop-zone">`
- Alt text for images, labels for form inputs

### CSS/Brutalist System
- Use `assets/css/brutalist.min.css` for all styling (minified version) - no inline Tailwind classes
- Reference CSS variables: `var(--accent)`, `var(--bg-primary)`, `var(--font-mono)`
- Utility classes: `.btn-primary`, `.btn-secondary`, `.input-brutal`, `.card-brutal`
- Add custom styles in `<style>` tags per-file for tool-specific styles
- Responsive breakpoints: 768px (mobile), 1024px (tablet)
- Use CSS Grid/Flexbox for layouts, avoid floats
- BEM-like naming: `.drop-zone__text`, `.btn--primary`

### Font Loading (Optimized)
- Fonts are inlined in `<head>` to eliminate render-blocking requests
- Clash Display (400,500,600,700 weights) and JetBrains Mono available via inline CSS
- font-display: swap enabled for performance
- Do not add external FontShare CSS links

### File Organization
- Each tool in: `tools/tool-name/index.html` (with optional script.js/style.css)
- Main hub: `index.html` at root
- Shared styles: `assets/css/brutalist.min.css`
- Assets: `assets/icons/icon.png` (favicon for all tools)
- Copy existing tool structure when adding new tools

### State Management
- Use `Image()` objects, check `.complete` before operations
- Store `Blob` objects for downloads, revoke object URLs after use
- Extract file base name: `file.name.replace(/\.[^/.]+$/, '')`

### External Dependencies
- JSZip, FileSaver.js, QRCode.js (CDN links in existing tools)
- Prefer native APIs over libraries, validate before adding dependencies

### Error Handling & Security
- Use error overlays instead of `alert()`, validate all inputs
- Never store/log user data, all processing client-side
- Revoke object URLs after use, avoid dangerous APIs
- Use `error.name === 'AbortError'` to distinguish aborted operations from real errors
- Check `signal.aborted` before continuing in async loops

### Code Formatting
- 4-space indentation, no trailing whitespace
- camelCase variables/functions, kebab-case IDs
- Double quotes for HTML, single for JS
- Section comments: `// Event Listeners`, `// State Management`

### Patterns & Best Practices
- **Video:** Use `loadedmetadata`/`timeupdate` events, revoke URLs on cleanup
- **Download:** Check browser support, use native APIs when possible
- **Drag & Drop:** Page-wide event listeners with counter pattern
- **Mobile:** Slide-out sidebar, touch-action optimization
- **Accessibility:** Labels, aria-hidden, keyboard navigation
- **Performance:** Cache DOM references, debounce handlers, use RAF

### Log Reader Specific Patterns
For tools handling large files:
- **Line indexing:** Build `lineIndex[]` array with byte offsets for each line start
- **Reading lines:** Use `file.slice(startPos, endPos)` for efficient random access
- **Chunk size:** Use 1MB chunks (`CHUNK_SIZE = 1024 * 1024`)
- **Search:** Leverage pre-built lineIndex for accurate line numbers, avoid re-counting
- **Memory:** Process files in chunks, never load entire file into memory

### Adding New Tools
1. Create `tools/tool-name/` directory
2. Copy existing tool structure (index.html + optional script/style)
3. Add tool card to main index.html
4. Test responsive design and mobile functionality

### Performance Optimization Guidelines
- **CSS:** Always use minified `brutalist.min.css` and inline critical styles
- **Fonts:** Inline font CSS to eliminate blocking requests (target <2.5s LCP)
- **Images:** Optimize icon sizes, use appropriate formats
- **JavaScript:** Keep scripts lightweight, use defer when possible
- **Bundle Size:** Monitor total transfer size, target <300KB
- **Testing:** Run Lighthouse regularly, maintain 90+ Performance score

### AI Assistant Guidelines
- When adding new tools, follow the established patterns exactly
- Use existing CSS classes and variables from brutalist.min.css
- Test manually in browser before considering complete
- Reference existing tools for implementation patterns
- When fixing bugs, analyze root cause before implementing (see log-reader search line numbering)
