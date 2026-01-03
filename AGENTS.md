# Web Tools Hub - Agent Guidelines

## Build/Run Commands

This project uses static HTML/CSS/JavaScript with no build process or testing framework.

- **Run locally:** `python3 -m http.server` or `npx http-server`
- **Deploy to GitHub Pages:** Push to `main` branch and enable GitHub Pages in repository settings
- **No build commands required** - tools run directly in browser
- **No test commands** - no automated testing framework configured

## Code Style Guidelines

### HTML Structure
- Use semantic HTML5 elements (header, main, footer, section, article)
- Include proper meta tags (charset, viewport)
- Link favicon relative to root: `<link rel="icon" type="image/png" sizes="32x32" href="../../assets/icons/icon.png">`
- Load Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Keep scripts at end of body tag (or inline for simple tools)

### CSS/Tailwind
- Use Tailwind utility classes for styling
- Add custom styles in `<style>` tags only when necessary (custom scrollbars, animations, etc.)
- Follow existing color scheme: gray-900/800/700 for backgrounds, blue/purple/indigo for accents
- Responsive design using `md:`, `lg:` breakpoints (mobile-first approach)
- Custom scrollbar styles: 8px width, gray-700 track, gray-600 thumb with hover state

### JavaScript Conventions
- **Variables:** Use `const` for immutable, `let` for mutable. Avoid `var`
- **Naming:** camelCase for variables/functions (`dropZone`, `handleFile`, `uploadedImage`)
- **Element IDs:** kebab-case (`drop-zone`, `upload-btn`, `preview`)
- **State variables:** Use descriptive names with `current`/`generated` prefixes (`currentUrl`, `generatedBlobs`)
- **DOM Selection:** Use `document.getElementById()` for elements with IDs
- **Event Handling:** Use `.addEventListener()` pattern with arrow functions for callbacks
- **Functions:** Keep small and focused, descriptive names (e.g., `loadImage`, `updateImagePosition`)

### Event Handling Patterns
- **Drag & Drop:** Use page-wide `dragenter`/`dragleave`/`drop` with counter for overlays
- **Prevent default:** Always call `e.preventDefault()` on drag events
- **File detection:** Check `e.dataTransfer.types.includes('Files')` before showing overlay
- **Counter pattern:** Use `dragCounter` to prevent flicker when dragging over child elements
- **Hide overlays:** Use `classList.remove('show')` with `setTimeout` for smooth transitions

### Class Manipulation
- **Show/hide:** Use `classList.add/remove('hidden')` for display toggle
- **Transitions:** Use `classList.add/remove('show')` with CSS transitions
- **Multiple classes:** Pass multiple arguments: `classList.add('border-blue-500', 'bg-blue-500/10')`
- **Toggle:** Use `classList.toggle('open')` for sidebar/overlay states
- **Timing:** Use `setTimeout(..., 300)` for 300ms transition delays

### State Management
- **Image state:** Track with `Image()` objects and check `.complete` before operations
- **URL cleanup:** Always revoke object URLs: `if (currentUrl) URL.revokeObjectURL(currentUrl)`
- **File naming:** Extract base name: `file.name.replace(/\.[^/.]+$/, '')`
- **Blob storage:** Store in arrays for bulk operations (`generatedBlobs.push({ name, blob })`)

### External Dependencies
- Tailwind CSS: `https://cdn.tailwindcss.com`
- JSZip: `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`
- FileSaver.js: `https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js`
- Check existing tools before adding new dependencies

### File Organization
- Each tool in: `tools/tool-name/index.html` (or with separate script.js/style.css)
- Main hub: `index.html` at root
- Assets: `assets/icons/icon.png` (favicon for all tools)
- Copy existing tool structure when adding new tools

### Image Handling
- Use HTML5 Canvas API for image manipulation
- Validate file types: `file.type.startsWith('image/')`
- Handle loading: use `img.onload` callbacks, check `img.complete`
- Clean up object URLs to prevent memory leaks
- Use `checkerboard` CSS pattern for transparent image backgrounds
- Canvas operations: `ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)`

### Error Handling
- Use `alert()` for user-facing errors (no console errors to users)
- Validate inputs before processing (file type, selected sizes, image loaded)
- Provide clear, actionable error messages
- Handle edge cases: no file selected, wrong file type, still loading

### Code Formatting
- 4-space indentation
- No trailing whitespace
- Clear section comments when helpful (`// Header`, `// Main Content`, `// Event Listeners`)
- Keep HTML readable with proper line breaks and indentation
- Script formatting: 2-space indentation for inline scripts, 4-space for separate files

### Adding New Tools
1. Create directory: `tools/your-tool/`
2. Choose structure: single `index.html` or separate `index.html` + `script.js` + `style.css`
3. Copy structure from existing tool (icon-resizer for simple, promo-cropper for complex)
4. Update page title, favicon path
5. Add card to main index.html (cycle colors: blue → purple → indigo → green → orange)
6. Ensure responsive design (mobile sidebar, touch events)

### Mobile/Responsive Patterns
- **Sidebar:** Fixed position on mobile (`left: -100%`), transform to show (`left: 0`)
- **Sidebar overlay:** Full-screen backdrop (`inset: 0`, `rgba(0,0,0,0.5)`)
- **Menu toggle:** Hamburger button visible only on mobile (`md:hidden`)
- **Touch events:** Use `touch-action: none` for draggable elements
- **Zoom controls:** Smaller buttons and text on mobile screens

### Accessibility
- Use `<label>` with `for` attributes for form inputs
- Add `aria-hidden` to decorative SVGs
- Ensure contrast ratios (gray text on dark backgrounds)
- Keyboard navigation for buttons and interactive elements
- Hidden file input, triggered by button click for custom styling

### Tool Card Pattern (main index.html)
- Grid layout with responsive breakpoints (1→2→3 columns)
- Card structure: icon box + title + description + "Launch Tool" link
- Hover effects: border color change, shadow, text color, arrow translation
- Placeholder card: dashed border, lower opacity, "More Coming Soon" text

### Button & Gradient Patterns
- **Primary buttons:** `bg-gradient-to-r from-blue-500 to-cyan-600` with hover states
- **Action buttons:** Include SVG icons with consistent sizing (w-5 h-5)
- **Group hover:** Use `group` on parent, `group-hover:` on children for coordinated effects
- **Transitions:** `transition-all duration-300` for smooth hover animations
- **Shadow:** `shadow-lg hover:shadow-xl` for depth effect on hover

### Canvas & Cropping Patterns
- **Target dimensions:** Store as separate variables (`targetW`, `targetH`) for easy access
- **Viewport scaling:** Calculate fit scale using `Math.min(viewportW / targetW, 1)` pattern
- **Transform scaling:** Apply with `container.style.transform = scale(${scaleFit})`
- **Image positioning:** Center with `(targetW - displayW) / 2` calculation
- **Canvas export:** Use `canvas.toDataURL('image/png')` for image generation

### Animation & Transition Patterns
- **Smooth overlays:** Use `opacity` transitions with `setTimeout` for delayed class changes
- **Pulse animation:** Keyframes with `scale(1)` → `scale(1.05)` → `scale(1)` pattern
- **Transition timing:** Match CSS transition duration (300ms) with JavaScript `setTimeout` delay
- **Element fade:** Remove 'hidden' class, wait 0ms, then add 'show' class for smooth fade-in

### Performance Best Practices
- **Debounce resize handlers:** Add timeout/delay for window resize events when possible
- **Cleanup on re-upload:** Clear previous state (`innerHTML = ''`, `generatedBlobs = []`)
- **URL lifecycle:** Always revoke object URLs before creating new ones to prevent memory leaks
- **Image preloading:** Check `img.complete` before operations, wait for `onload` if needed
- **Event cleanup:** Remove event listeners when components are destroyed (if applicable)

### Common UI Patterns
- **Loading states:** Disable buttons during processing (`disabled` attribute or pointer-events)
- **Progress feedback:** Show results container after processing completes
- **Form validation:** Check inputs before starting operations (selected sizes, file type)
- **Empty states:** Use placeholder text or icons when no content is loaded
- **Success feedback:** Show download buttons/results only after successful generation
