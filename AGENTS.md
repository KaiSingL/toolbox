# Web Tools Hub - Agent Guidelines

## Build/Run Commands

This project uses static HTML/CSS/JavaScript with no build process or testing framework.

- **Run locally:** `python3 -m http.server` or `npx http-server`
- **Deploy to GitHub Pages:** Push to `main` branch and enable GitHub Pages in repository settings
- **No build commands required** - tools run directly in browser
- **No test commands** - no automated testing framework configured

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

### CSS/Brutalist System
- Use `assets/css/brutalist.css` for all styling - no inline Tailwind classes
- Reference CSS variables: `var(--accent)`, `var(--bg-primary)`, `var(--font-mono)`
- Utility classes: `.btn-primary`, `.btn-secondary`, `.input-brutal`, `.card-brutal`
- Add custom styles in `<style>` tags per-file for tool-specific styles
- Responsive breakpoints: 768px (mobile), 1024px (tablet)

### HTML Structure
- Use semantic HTML5 elements (header, main, footer, section, article)
- Include proper meta tags (charset, viewport)
- Link favicon relative to root: `<link rel="icon" type="image/png" sizes="32x32" href="../../assets/icons/icon.png">`
- Load brutalist.css: `<link rel="stylesheet" href="../../assets/css/brutalist.css">`
- Keep scripts at end of body tag

### JavaScript Conventions
- **Variables:** Use `const` for immutable, `let` for mutable. Avoid `var`
- **Naming:** camelCase for variables/functions (`dropZone`, `handleFile`, `uploadedImage`)
- **Element IDs:** kebab-case (`drop-zone`, `upload-btn`, `preview`)
- **State variables:** Use descriptive names with `current`/`generated` prefixes (`currentUrl`, `generatedBlobs`)
- **DOM Selection:** Use `document.getElementById()` for elements with IDs
- **Event Handling:** Use `.addEventListener()` with arrow functions
- **Functions:** Keep small and focused, descriptive names

### File Organization
- Each tool in: `tools/tool-name/index.html` (with optional script.js/style.css)
- Main hub: `index.html` at root
- Shared styles: `assets/css/brutalist.css`
- Assets: `assets/icons/icon.png` (favicon for all tools)
- Copy existing tool structure when adding new tools

### State Management
- **Image state:** Track with `Image()` objects, check `.complete` before operations
- **URL cleanup:** Always revoke object URLs: `if (currentUrl) URL.revokeObjectURL(currentUrl)`
- **File naming:** Extract base name: `file.name.replace(/\.[^/.]+$/, '')`
- **Blob storage:** Store in arrays for bulk operations (`generatedBlobs.push({ name, blob })`)

### External Dependencies
- JSZip: `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`
- FileSaver.js: `https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js`
- QRCode.js: `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`
- Check existing tools before adding new dependencies

### Error Handling
- Use `alert()` for user-facing errors
- Validate inputs before processing (file type, selected sizes, image loaded)
- Provide clear, actionable error messages
- Handle edge cases: no file selected, wrong file type, still loading

### Code Formatting
- 4-space indentation
- No trailing whitespace
- Clear section comments when helpful (`// Header`, `// State Management`, `// Event Listeners`)
- Keep HTML readable with proper line breaks and indentation

### Event Handling Patterns
- **Drag & Drop:** Use page-wide `dragenter`/`dragleave`/`drop` with counter for overlays
- **Prevent default:** Always call `e.preventDefault()` on drag events
- **File detection:** Check `e.dataTransfer.types.includes('Files')` before showing overlay
- **Counter pattern:** Use `dragCounter` to prevent flicker over child elements

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
