# Conversion-correctness suite

This suite validates the Markdown → Textile converter's **semantic** output: for
each test case it renders the original Markdown to HTML with CommonMarker,
runs the JS converter to produce Textile, renders that Textile to HTML with
Redmine's own Textile formatter (vendored `redcloth3.rb`), then asserts the two
normalized HTML strings are equal.

It is **not** an end-to-end / browser test — it exercises only the conversion
logic (`MarkdownToTextile.convert`), not the UI.

## Scope

Covers the Markdown → Textile direction only:

- inline syntax (bold, italic, strikethrough, code, links, images)
- block syntax (headings, blockquotes, ordered/unordered lists, horizontal rules)
- tables (simple, empty cells, alignment, formatted headers, formatted cells, images/links in cells)
- combined documents (headings + paragraphs + lists + tables)
- code blocks (fenced, with and without a language)
- the user-reported 2FA 30-minute expiry table case

## Out of scope (explicit)

The suite does **not** cover:

- **The Textile → Markdown direction** (the reverse convertToMarkdown path in
  `script.js`).
- **UI behavior**: button click handlers, the textarea swap, error overlay, the
  Copy button, responsive layout, mobile rendering.
- **`table-normalize.js` and `code-block.js`** internals that do not surface as
  visible HTML differences in the listed cases.
- **Task list markers** (`- [x]` / `- [ ]`): GFM renders them as
  `<input type="checkbox">`, our converter produces Redmine-style colored text
  `{color:green}(/){color}`. They are semantically different by design and cannot
  round-trip via raw HTML comparison. They are exercised as string-level
  converter tests (now removed) but deliberately omitted here.
- **Inputs not encoded as cases** in `cases.rb`.

## Setup

Requirements:

- **Ruby >= 3.2** on PATH
- **Node.js** on PATH (used to run the JS converter)
- The `commonmarker` gem:

  ```sh
  gem install commonmarker
  ```

No npm install required (this is a pure Ruby test runner that shells out to node).

## Run

```sh
pnpm test:conversion
```

or directly:

```sh
ruby tools/markdown-textile/test/run.rb
```

Output is one line per case showing `PASS` / `FAIL` / `ERR`, followed by a
`N/M pass; K fail` summary. Exits non-zero on any failure. If `commonmarker` is
missing it exits immediately with an install hint.

## Files

| File | Purpose |
|------|---------|
| `run.rb` | test runner: loads `cases.rb` and runs each case |
| `cases.rb` | the list of `{ name:, markdown: }` test cases |
| `html_normalize.rb` | HTML normalizer (collapses the stylistic differences between CommonMarker and RedCloth3 output) |
| `../vendor/redmine/` | vendored Redmine Textile formatter (`redcloth3.rb` etc.) — see that folder's README |

## Adding a case

Append to `cases.rb`:

```ruby
{ name: 'my case', markdown: "your **markdown** here" }
```

The expected HTML is whatever CommonMarker produces from `markdown`; the
converter's Textile must render (via RedCloth3) to the same normalized HTML. If
CommonMarker and RedCloth3 have a stylistic difference not covered by the
existing normalizer, extend `html_normalize.rb` rather than weakening the case.