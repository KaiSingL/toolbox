# Web Tools Hub - Agent Guidelines

## Build/Run/Test Commands

This project uses static HTML/CSS/JavaScript with no build process, linting tools, or automated testing framework. All tools run directly in the browser with no compilation step.

- **Run locally:** `python3 -m http.server` (serves on http://localhost:8000) or `npx http-server`
- **Deploy to GitHub Pages:** Push to `main` branch and enable GitHub Pages in repository settings
- **No build commands required** - tools run directly in browser
- **No test commands** - no automated testing framework configured
- **Manual testing:** Open tool in browser after running local server. Test functionality, responsive design, and edge cases manually.
- **Running a single test:** Since no automated tests exist, "test" a single tool by navigating to `http://localhost:8000/tools/tool-name/` and verifying expected behavior.

## Cursor Rules & Copilot Instructions

No Cursor rules (.cursor/rules or .cursorrules) or Copilot rules (.github/copilot-instructions.md) are configured for this repository. Follow the guidelines below for consistent code generation.

## Design System

### Neo-Brutalist Style (Current)
This project uses a neo-brutalist design system defined in `assets/css/brutalist.css`:
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
- **Naming:** camelCase for variables/functions (`dropZone`, `handleFile`, `uploadedImage`)
  - Prefix state variables: `currentUrl`, `generatedBlobs`, `uploadedImage`
  - Prefix event handlers: `handleFile`, `onDragOver`
  - Use descriptive names: `fileInput` not `input`, `previewCanvas` not `canvas`
- **Element IDs:** kebab-case (`drop-zone`, `upload-btn`, `preview`)
- **Constants:** UPPER_SNAKE_CASE for magic numbers (`MAX_FILE_SIZE = 10 * 1024 * 1024`)
- **Functions:** Keep small (<20 lines), descriptive names, single responsibility
- **Arrow Functions:** Use for callbacks and anonymous functions
- **Template Literals:** Prefer over string concatenation
- **DOM Selection:** Use `document.getElementById()` for single elements, `document.querySelector()` sparingly
- **Event Handling:** Use `.addEventListener()` with arrow functions, avoid inline handlers
- **Async/Await:** Use for promises, avoid `.then()` chains
- **Error Handling:** Use try/catch for async operations, validate inputs early
- **Comments:** Section comments (`// Event Listeners`), avoid obvious comments
- **Imports:** No ES6 modules; all scripts loaded via `<script>` tags
- **Types:** Dynamic typing; no TypeScript; document complex objects in comments

### HTML Structure
- Use semantic HTML5 elements (header, main, footer, section, article)
- Include proper meta tags (charset, viewport, og: tags for social sharing)
- Link favicon relative to root: `<link rel="icon" type="image/png" sizes="32x32" href="../../assets/icons/icon.png">`
- Load brutalist.css: `<link rel="stylesheet" href="../../assets/css/brutalist.css">`
- Keep scripts at end of body tag for performance
- Use data attributes for JS hooks: `<div data-component="drop-zone">`
- Alt text for images, labels for form inputs

### CSS/Brutalist System
- Use `assets/css/brutalist.css` for all styling - no inline Tailwind classes
- Reference CSS variables: `var(--accent)`, `var(--bg-primary)`, `var(--font-mono)`
- Utility classes: `.btn-primary`, `.btn-secondary`, `.input-brutal`, `.card-brutal`
- Add custom styles in `<style>` tags per-file for tool-specific styles
- Responsive breakpoints: 768px (mobile), 1024px (tablet)
- Use CSS Grid/Flexbox for layouts, avoid floats
- BEM-like naming: `.drop-zone__text`, `.btn--primary`
- Avoid !important; use specificity wisely

### File Organization
- Each tool in: `tools/tool-name/index.html` (with optional script.js/style.css)
- Main hub: `index.html` at root
- Shared styles: `assets/css/brutalist.css`
- Assets: `assets/icons/icon.png` (favicon for all tools)
- Copy existing tool structure when adding new tools
- Keep tool-specific styles in `<style>` tags within index.html or separate style.css

### State Management
- **Image state:** Track with `Image()` objects, check `.complete` before operations
- **Video state:** Use video events (`loadedmetadata`, `timeupdate`) for scrubber sync
- **Blob state:** Store `Blob` objects for downloads, create object URLs as needed
- **URL cleanup:** Always revoke object URLs: `if (currentUrl) URL.revokeObjectURL(currentUrl)`
- **File naming:** Extract base name: `file.name.replace(/\.[^/.]+$/, '')`
- **Blob storage:** Store in arrays for bulk operations (`generatedBlobs.push({ name, blob })`)

### External Dependencies
- JSZip: `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` (for ZIP downloads)
- FileSaver.js: `https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js` (optional, use native download when possible)
- QRCode.js: `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`
- Check existing tools before adding new dependencies
- Prefer native browser APIs over libraries when available
- Load scripts from CDN for reliability

### Error Handling
- Use error overlay for user-facing errors instead of `alert()`
- Validate inputs before processing (file type, selected sizes, image loaded)
- Provide clear, actionable error messages in overlay below header
- Handle edge cases: no file selected, wrong file type, still loading
- Use try/catch for async operations like clipboard access and downloads
- Graceful degradation: disable features for unsupported browsers
- Auto-dismiss error overlays after 5 seconds

### Code Formatting
- 4-space indentation
- No trailing whitespace
- Clear section comments when helpful (`// Header`, `// State Management`, `// Event Listeners`)
- Keep HTML readable with proper line breaks and indentation
- Consistent quote style: double quotes for HTML attributes, single for JS strings
- Line length: aim for <100 characters, break long lines appropriately

### Security Best Practices
- Never store or log user data
- All processing client-side only
- No server communication
- Validate file types and sizes
- Revoke object URLs after use
- Avoid eval() or dangerous APIs

### Video Handling Patterns
- **Loading:** Create object URL from file, set to video.src, call video.load()
- **Metadata:** Listen to `loadedmetadata` for duration and setup scrubber max
- **Scrubber sync:** Bidirectional: slider changes video.currentTime, video timeupdates update slider
- **Frame capture:** Draw video to canvas using `ctx.drawImage(video, 0, 0)` at current time
- **Cleanup:** Revoke object URLs on new uploads to prevent memory leaks

### Download Patterns
- **Native download:** Use `URL.createObjectURL(blob)` + temporary `<a>` with `download` attribute
- **Browser support:** Check `'download' in document.createElement('a')`
- **Fallback:** Disable button with explanatory text for unsupported browsers
- **Error handling:** Show overlay for blocked downloads or failures
- **Memory:** Always revoke object URLs after download attempt

### Event Handling Patterns
- **Drag & Drop:** Use page-wide `dragenter`/`dragleave`/`drop` with counter for overlays
- **Prevent default:** Always call `e.preventDefault()` on drag events
- **File detection:** Check `e.dataTransfer.types.includes('Files')` before showing overlay
- **Counter pattern:** Use `dragCounter` to prevent flicker over child elements
- **Upload state:** Add `has-video` class to hide upload label after successful load

### Mobile Patterns
- **Sidebar:** Fixed left (desktop) / slide-out from left (mobile)
- **Sidebar overlay:** Full-screen backdrop with `rgba(0,0,0,0.7)`
- **Menu toggle:** Hamburger button visible only on mobile (`display: none` on desktop)
- **Touch events:** Use `touch-action: none` for draggable elements

### Accessibility
- Use `<label>` with `for` attributes for form inputs
- Add `aria-hidden` to decorative SVGs
- Ensure contrast ratios
- Keyboard navigation for buttons and interactive elements
- Hidden file input, triggered by button click for custom styling

### Adding New Tools
1. Create directory: `tools/your-tool/`
2. Create `index.html` with brutalist.css (copy from existing tool)
3. Add tool card to main `index.html` with animation-delay for staggered reveal
4. Update page title, favicon path
5. Ensure mobile sidebar slide-out works
6. Test responsive design on mobile viewport

### Performance Best Practices
- Debounce resize handlers with timeout
- Cleanup on re-upload: clear `innerHTML = ''`, `generatedBlobs = []`
- Always revoke object URLs before creating new ones
- Check `img.complete` before operations, wait for `onload` if needed
- Minimize DOM queries; cache element references
- Use requestAnimationFrame for animations

### Code Review Guidelines
- Ensure all user inputs are validated
- Check for proper error handling and user feedback
- Verify accessibility: keyboard navigation, screen reader support
- Confirm responsive design works on mobile
- Test edge cases: empty inputs, invalid files, network failures
- Follow security practices: no data storage/transmission
- Maintain consistent code style and naming conventions

### AI Assistant Guidelines
- When adding new tools, follow the established patterns exactly
- Use existing CSS classes and variables from brutalist.css
- Test manually in browser before considering complete
- Provide clear commit messages following repo style
- If unsure about implementation, reference existing tools
- Prioritize user experience and accessibility
