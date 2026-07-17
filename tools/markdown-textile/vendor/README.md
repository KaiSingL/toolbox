# Vendored libraries

These libraries are vendored locally (off-CDN) for the Markdown ↔ Textile tool.

| Library | Version | Source | License |
|---------|---------|--------|---------|
| textile-js | 2.1.1 | https://cdn.jsdelivr.net/npm/textile-js@2.1.1/lib/textile.js | BSD-2-Clause |
| turndown | 7.1.3 | https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.3/turndown.min.js | MIT |

Both expose browser globals when loaded via `<script>`: `window.textile` and `TurndownService`.
