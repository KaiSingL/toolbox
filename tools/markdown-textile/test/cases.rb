# Test cases for the conversion-correctness suite.
# Each case is { name: <string>, markdown: <string> }.
# Expected behavior: CommonMarker.render(markdown) and
# RedCloth3.render(MarkdownToTextile.convert(markdown)) should produce
# HTML that compares equal after HtmlNormalize.normalize_html.
#
# Task markers (GFM "- [x]"/"- [ ]") are intentionally excluded: GFM renders
# them as <input type=checkbox>, our converter produces Redmine-style
# {color:green}(/){color} colored text. They are semantically different by
# design and cannot round-trip via raw HTML comparison.

CASES = [
  # --- inline syntax ---
  { name: 'bold', markdown: '**bold**' },
  { name: 'bold underscore', markdown: '__bold__' },
  { name: 'italic', markdown: '*italic*' },
  { name: 'italic underscore', markdown: '_italic_' },
  { name: 'strikethrough', markdown: '~~deleted~~' },
  { name: 'inline code', markdown: '`code`' },
  { name: 'link', markdown: '[link](https://example.com)' },
  { name: 'image', markdown: '![alt](https://example.com/img.png)' },
  { name: 'link and image', markdown: 'Visit [Example](https://example.com) and view ![Logo](https://example.com/logo.png).' },

  # --- block syntax ---
  { name: 'h1', markdown: '# Heading' },
  { name: 'h2', markdown: '## Heading' },
  { name: 'h3', markdown: '### Heading' },
  { name: 'blockquote', markdown: '> Quote' },
  { name: 'unordered list', markdown: "- Apple\n- Banana\n- Orange" },
  { name: 'ordered list', markdown: "1. First\n2. Second\n3. Third" },
  { name: 'horizontal rule', markdown: '---' },

  # --- text around syntax ---
  { name: 'text around bold', markdown: 'Before **bold** after' },
  { name: 'text around code', markdown: 'Before `code` after' },
  { name: 'text around link', markdown: 'Before [link](https://example.com) after' },
  { name: 'syntax adjacent to punctuation', markdown: 'Status: **failed**.' },
  { name: 'code adjacent to punctuation', markdown: 'Run `npm test`, then continue.' },
  { name: 'italic adjacent to punctuation', markdown: 'This is *important*!' },
  { name: 'repeated bold', markdown: '**one** and **two**' },
  { name: 'repeated code', markdown: '`one` and `two`' },
  { name: 'repeated links', markdown: '[one](https://one.example) and [two](https://two.example)' },

  # --- simple combined cases ---
  { name: 'heading then paragraph', markdown: "## Introduction\n\nThis is a simple paragraph." },
  { name: 'paragraph multi inline', markdown: 'This contains **bold**, *italic*, ~~deleted~~, and `code`.' },
  { name: 'formatted list items', markdown: "- **Required** item\n- Run `npm test`\n- Read [documentation](https://example.com)" },

  # --- simple tables ---
  { name: 'simple table', markdown: "| Name | Status |\n| --- | --- |\n| API | Active |\n| Web | Inactive |" },
  { name: 'table empty cell', markdown: "| Name | Email | Status |\n| --- | --- | --- |\n| Alice | alice@example.com | Active |\n| Bob |  | Inactive |" },
  { name: 'table one data row', markdown: "| Key | Value |\n| --- | --- |\n| environment | production |" },

  # --- complex table cases ---
  { name: 'bold in table cell', markdown: "| Service | Status |\n| --- | --- |\n| API | **Active** |\n| Worker | **Inactive** |" },
  { name: 'italic in table cell', markdown: "| Name | Description |\n| --- | --- |\n| Alpha | *Experimental* |\n| Beta | _Stable_ |" },
  { name: 'strikethrough in table cell', markdown: "| Task | Status |\n| --- | --- |\n| Old task | ~~Cancelled~~ |" },
  { name: 'inline code in table cell', markdown: "| Action | Command |\n| --- | --- |\n| Test | `npm test` |\n| Build | `npm run build` |" },
  { name: 'links in table cells', markdown: "| Project | Website |\n| --- | --- |\n| Example | [Docs](https://example.com) |" },
  { name: 'images in table cells', markdown: "| Product | Logo |\n| --- | --- |\n| Alpha | ![Alpha logo](https://example.com/alpha.png) |" },
  { name: 'multi-format row', markdown: "| Feature | Status | Example |\n| --- | --- | --- |\n| Formatting | **Supported** | Use `convert()` |\n| Links | *Available* | [Docs](https://example.com) |\n| Legacy | ~~Removed~~ | None |" },
  { name: 'multi-format cell', markdown: "| Item | Description |\n| --- | --- |\n| Build | **Required**, *automatic*, and `npm run build` |" },
  { name: 'formatting in headers', markdown: "| **Name** | `Command` | *Status* |\n| --- | --- | --- |\n| Build | npm run build | Active |" },
  { name: 'alignment and inline formatting', markdown: "| Name | Status | Result |\n| :--- | :---: | ---: |\n| API | **Running** | `200` |\n| Worker | ~~Stopped~~ | *Failed* |" },
  { name: 'image vs link in table', markdown: "| Type | Value |\n| --- | --- |\n| Link | [Example](https://example.com) |\n| Image | ![Logo](https://example.com/logo.png) |" },

  # --- complex documents ---
  { name: 'document mix', markdown: <<~MD },
    # Release Report

    The **release completed** with one *warning*.

    ## Summary

    | Component | Status | Details |
    | --- | :---: | --- |
    | API | **Passed** | See [report](https://example.com) |
    | Web | **Passed** | Run `npm test` |
    | Worker | ~~Failed~~ | Reason: *timeout* |

    ## Next Steps

    1. Review the failed job
    2. Update the configuration
    3. Run `npm test` again
  MD
  { name: 'table then paragraph', markdown: "| Name | Status |\n| --- | --- |\n| API | **Active** |\n\nThis paragraph follows the table." },
  { name: 'list then table', markdown: "- First item\n- Second item\n\n| Name | Status |\n| --- | --- |\n| API | Active |" },

  # --- code blocks ---
  { name: 'fenced code block no lang', markdown: "```\nplain code\n```" },
  { name: 'fenced code block with lang', markdown: "```js\nconst x = 1;\n```" },

  # --- user-reported case ---
  { name: 'user-reported 2FA table', markdown: <<~MD }    ## 7. 2FA 30-Minute Expiry

    This should NOT apply to the TOTP secret.
    It applies to elevated confidential access.

    | Component | Lifetime |
    | --- | --- |
    | Login session | Normal |
    | TOTP secret | Until reset |
    | OTP code | 30 seconds |
    | Confidential access | 30 minutes |
  MD
].freeze

# Hand-written Redmine Textile fixtures for the reverse direction.
# These test constructs that are native to Textile / Redmine and may not have
# a direct Markdown equivalent in the forward direction.
REVERSE_CASES = [
  { name: 'tx: heading', textile: 'h1. Heading' },
  { name: 'tx: h2 + paragraph', textile: "h2. Heading\n\nThis is a paragraph." },
  { name: 'tx: bold and italic', textile: 'This is *bold* and _italic_.' },
  { name: 'tx: strikethrough', textile: 'This is -deleted-.' },
  { name: 'tx: inline code', textile: 'Use @code@ here.' },
  { name: 'tx: link', textile: '"Example":https://example.com' },
  { name: 'tx: image', textile: '!https://example.com/img.png(Alt text)!' },
  { name: 'tx: blockquote', textile: 'bq. A quoted paragraph.' },
  { name: 'tx: unordered list', textile: "* Apple\n* Banana\n* Orange" },
  { name: 'tx: ordered list', textile: "# First\n# Second\n# Third" },
  { name: 'tx: horizontal rule', textile: '----' },
  { name: 'tx: simple table', textile: "|_. Name |_. Status |\n| API | Active |\n| Web | Inactive |" },
  { name: 'tx: table with formatting', textile: "|_. Service |_. Status |\n| API | *Active* |\n| Worker | -Stopped- |" },
  { name: 'tx: table with code', textile: "|_. Action |_. Command |\n| Test | @npm test@ |\n| Build | @npm run build@ |" },
  { name: 'tx: paragraph with link and image', textile: 'Visit "Example":https://example.com and view !https://example.com/logo.png(Logo)!.' },
  { name: 'tx: mixed document', textile: <<~TX },
    h1. Release Report

    The *release completed* with one _warning_.

    h2. Summary

    |_. Component |_. Status |_. Details |
    | API | *Passed* | See "report":https://example.com |
    | Web | *Passed* | Run @npm test@ |

    h2. Next Steps

    # Review the failed job
    # Update the configuration
  TX
  { name: 'tx: bold-header table (Redmine idiom)', textile: <<~TX },
    | *Component* | *Lifetime* |
    | Login session | Normal |
    | TOTP secret | Until reset |
    | OTP code | 30 seconds |
    | Confidential access | 30 minutes |
  TX
  { name: 'tx: >> blockquote separated by blank lines', textile: <<~TX },
    >> Rails is a full-stack framework for developing database-backed web applications according to the Model-View-Control pattern.

    >> To go live, all you need to add is a database and a web server.

    > Great!
  TX
  { name: 'tx: >> consecutive with > no blank line', textile: <<~TX },
    >> Rails is a full-stack framework for developing database-backed web applications according to the Model-View-Control pattern.
    > To go live, all you need to add is a database and a web server.
  TX
].freeze