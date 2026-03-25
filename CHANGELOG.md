# Changelog

## 1.5.2 — 2026-03-25

- Hide `<define-element>` blocks until processed (FOUC prevention)
- Handle closed shadow DOM without throwing
- Recover browser-consumed declarative shadow DOM (open mode only)
- Rename internals: `_de` → `_de_inited`, `_de_proc` → `_de_processed`, `_de_this` → `_de_host`
- Add TypeScript declarations
- Add `exports` map to package.json
- Remove dead test files, clean .gitignore
- Add Playwright browser tests to CI
- Document limitations in README

## 1.5.1 — 2026-03-25

- Recover browser-consumed declarative shadow DOM templates

## 1.5.0 — 2026-03-18

- Run script before processor/template render (was after)

## 1.4.1 — 2026-03-18

- Re-render on reconnect if processor was set after first connect

## 1.4.0 — 2026-03-18

- Copy arrays/objects on prop set to strip reactive proxies
- Track pending `<define-element>` blocks, flush on processor assignment

## 1.3.0 — 2026-03-18

- Remove separate `state` object — props live on `this.props` directly
- Processor signature: `(root, state) => void` (was `=> state`)
- Replace `onattributechanged` with `onpropchange(name, val)`
- Stop serializing array/object to attributes

## 1.2.0 — 2026-03-17

- Remove template-parts dependency and JS API exports
- Processor becomes `DefineElement.processor` static property with late-binding
- Guard against double-init
- Coerce prop defaults at parse time

## 1.1.5 — 2026-03-17

- Fix array type coercion (passthrough instead of `Array.from`)

## 1.1.4 — 2026-03-16

- Use macro-task fallback when `<define-element>` has no children yet (sync script mid-parse)

## 1.1.3 — 2026-03-16

- Clear stale children before processor runs
- Add `host` reference to state object

## 1.1.2 — 2026-03-16

- Remove named exports (side-effect only)

## 1.1.1 — 2026-03-16

- Strip non-prop attributes from host during processor execution (prevents parent directives leaking)

## 1.1.0 — 2026-03-14

- New processor contract: `(root, state) => state`
- Skip function serialization to attributes

## 1.0.0 — 2026-03-13

- Typed props with coercion (string, number, boolean, date, array, object, auto)
- Scoped styles (light DOM via CSS nesting, shadow DOM via adoptedStyleSheets)
- Declarative shadow DOM support
- Lifecycle: onconnected, ondisconnected, onpropchange, onadopted
- Pluggable processor slot for template engines
- `is=""` customized built-in support
