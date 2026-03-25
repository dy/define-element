# Changelog

## 1.5.1 — 2026-03-25

- Fix declarative shadow DOM recovery for browser-consumed templates
- Website update

## 1.5.0 — 2026-03-18

- Render order: script runs before template render
- Website and documentation rewrite

## 1.4.1 — 2026-03-18

- Fix reconnect when processor set after initial connect

## 1.4.0 — 2026-03-18

- Strip reactive proxy from array/object prop setters
- Array/object props no longer reflect to attributes

## 1.3.0 — 2026-03-18

- Simplify props: remove separate state object, use `this.props` directly
- Consolidate tests

## 1.2.0 — 2026-03-17

- Consolidate test suite, remove template-parts bundling
- Browser loading tests

## 1.1.0 — 2026-03-14

- New processor contract: `(root, state) => void`
- Temporarily strip non-prop host attributes during processor execution
- Skip function serialization to attributes

## 1.0.0 — 2026-03-13

- Initial release
- Typed props with coercion (string, number, boolean, date, array, object, auto)
- Scoped styles (CSS nesting for light DOM, adoptedStyleSheets for shadow DOM)
- Shadow DOM with declarative shadow DOM support
- Lifecycle callbacks (onconnected, ondisconnected, onpropchange, onadopted)
- Pluggable processor for template engines
- `is=""` customized built-in element support
