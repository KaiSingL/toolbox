# Vendored Redmine Textile formatter

These files are vendored locally so the conversion-correctness test suite can render
Textile the same way Redmine does, without depending on a running Redmine instance.

## Files

| File | Source | License |
|------|--------|---------|
| `redcloth3.rb` | `lib/redmine/wiki_formatting/textile/redcloth3.rb` from the Redmine repository | BSD (originally RedCloth by why the lucky stiff) |
| `url.rb` | `lib/redmine/helpers/url.rb` from the Redmine repository | GPL-2 (Redmine) |
| `polyfills.rb` | local, hand-written | MIT (this repo, AGPL-3.0) |

`redcloth3.rb` is a pure-Ruby Textile formatter (it subclasses `String` and does not
require the C `RedCloth` gem). It carries Redmine-specific extensions on top of the
Textile spec.

`url.rb` provides the `Redmine::Helpers::URL` module that `redcloth3.rb` mixes in.

`polyfills.rb` provides the tiny subset of ActiveSupport string helpers that
`redcloth3.rb` calls (`String#blank?`, `String#starts_with?`, `String#present?`).

## Source

Vendored from the Redmine `master` branch:

- https://github.com/redmine/redmine/blob/master/lib/redmine/wiki_formatting/textile/redcloth3.rb
- https://github.com/redmine/redmine/blob/master/lib/redmine/helpers/url.rb

Redmine is licensed under GPLv2 (or later). `redcloth3.rb` itself is BSD-licensed
(original RedCloth); both are compatible with this repo's AGPL-3.0.

## Updating

Re-download both files from the URLs above when you want to track upstream Redmine
behavior. There is no build step — the `.rb` files are loaded directly by
`../../test/run.rb`.