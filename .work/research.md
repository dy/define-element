## [ ] Template syntax

1. `attr={{value}}`
  + template-parts proposal
  + doesn't require `:`, `@` syntax
  + more subscript-friendly
  + easy string templating, eg. `id="foo {{ bar }} baz"`
  + easy content templating, eg. `<a href="#{{item.href}}">Link: {{item.title}}</a>`
  - SVG quirks
    + we can use it only inside of `<template>` (not templize), so can be mitigated
  - table quirks
    ~ some relative workaround, not absolute
  - conflict with liquid (needs verbatim or something like that)
    ~ limiting to `<template>` tag?
  - uninitialized values flash
    ~+ limiting to `<template>` solves the issue
  - not generic templating (limited to attribs / content)
    ~ not really needed
  ?- how to display conditions
    ? `<template if="expression">`
  ?- how to display loops
    ~ Svelte has reasonable commands besides if/each, `@const` (same as with - for local state), `@html`, `#await`, `#key`
    ? `<template for="{{ item in i }}">`?

2. `:attr="value"`
  + no fouc - alternative dynamic value
  + no browser blockers
  + clearly pertains to attributes
  + can be generalized to any directives
  + allows :each, :if
  - no content insertions, need to use a tag
    - in particular #14 - no way to render repeated fragment
  - too much JS
    - no easy string templating eg. `:id="``foo ${bar} baz``"`

3. `attr="{value}"`
  + react/svelte-like
  + most minomalistic
  - confusable with objects as attr values
  - svg, table quirks

## [x] Scoped attribute

  **Question**: Should `<script>` and `<style>` inside a definition require a `scoped` attribute?

  ### Options considered

  #### A. `<script scoped>` / `<style scoped>` (explicit scoping)
  ```html
  <x-widget>
    <template>...</template>
    <style scoped>:host { display: block; }</style>
    <script scoped>this.onclick = console.log</script>
  </x-widget>
  ```
  - Implies non-scoped variant exists — what would `<script>` (no scoped) mean inside a component definition?
  - Two behaviors for same tag in same context creates cognitive load
  - `scoped` was an HTML attribute on `<style>` that browsers removed (deprecated in HTML5.1, never widely implemented) — reusing it is misleading
  - Forces explaining the distinction in docs

  #### B. No attribute — everything inside definition is component-scoped (chosen)
  ```html
  <x-widget>
    <template>...</template>
    <style>:host { display: block; }</style>
    <script>this.onclick = console.log</script>
  </x-widget>
  ```
  - No ambiguity: `<script>` in a definition = component script, `<style>` in a definition = component style
  - Global scripts/styles belong outside `<define-element>` — that's where global things live
  - Fewer concepts to learn
  - Matches SFC conventions (Vue, Svelte) — `<script>` in a component file is component code

  ### Global script/style — do we need it?

  **No.** Use cases analysis:

  1. **Modal overlay that needs global CSS** — Put the `<style>` outside `<define-element>`, next to it. Or use shadow DOM (naturally encapsulated). Or use JS: `document.head.appendChild(styleEl)` in the component script.

  2. **Shared imports/setup at define-time** — Put `<script type="module">` before `<define-element>`. This is where imports already go (`import 'define-element'`; `import 'sprae/define'`).

  3. **Side-effects on registration** — Rare. If needed, do it in the component script on first connect, or outside `<define-element>`.

  Every "global" use case has a natural home outside the definition. Putting global things inside a component definition is a code smell — it couples global concerns to component scope.

  ### Decision
  Drop `scoped` attribute. All `<script>` and `<style>` inside a definition are component-scoped. Global things go outside `<define-element>`.

  ### CSS scoping mechanism

  For light DOM, component `<style>` is wrapped in `@scope`:
  ```css
  /* input */
  :host { display: block; }
  span { color: red; }

  /* output */
  @scope (x-widget) {
    :scope { display: block; }
    span { color: red; }
  }
  ```

  - `@scope` is Baseline since Dec 2025 (Chrome 118+, Safari 17.4+, Firefox 146+)
  - `:host` is rewritten to `:scope` (equivalent meaning within `@scope`)
  - For shadow DOM, `adoptedStyleSheets` is used (shared across instances)
  - No regex CSS parsing needed — the browser handles all CSS features (`@media`, `@keyframes`, nesting, etc.)
