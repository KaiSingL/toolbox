# Vendored libraries

These libraries are vendored locally (off-CDN) for the Markdown ↔ Textile tool.

| Library | Version | Source | License |
|---------|---------|--------|---------|
| textile-js | 2.1.1 | https://cdn.jsdelivr.net/npm/textile-js@2.1.1/lib/textile.js | BSD-2-Clause |
| turndown | 7.1.3 | https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.3/turndown.min.js | MIT |
| turndown-plugin-gfm | 1.0.2 | https://cdn.jsdelivr.net/npm/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.min.js | MIT |

All expose browser globals when loaded via `<script>`: `window.textile`, `TurndownService`, and `turndownPluginGfm` (with `.gfm`, `.tables`, `.strikethrough`, `.taskListItems`).
