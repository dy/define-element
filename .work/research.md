## [x] Template syntax -> changeable procesor

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

## Script execution order: before render (decided)

  ### Problem
  Script runs after `_render()`. Processor-based CEs can't define methods in `<script>` that the template scope needs — the scope is already created by the time the script runs.

  ### Options considered

  #### A. Always script-after-render (was current)
  - Script has DOM access (template already cloned)
  - But methods defined in script aren't in processor scope
  - Script body and `onconnected` fire at nearly the same time — redundant

  #### B. Conditional: script-before when processor active, after when not
  - Implicit behavior based on global `_processor` state
  - Same CE behaves differently depending on when processor was set
  - User doesn't know timing changed — `querySelector` silently returns null

  #### C. Always script-before-render (chosen)
  - Script = define logic (methods, state, callbacks). Like a class body.
  - Processor = render DOM (clone, bind, hydrate). Like `render()`.
  - `onconnected` = element is live in DOM. Like `connectedCallback`.
  - Three phases, one order, always. No mode switch.

  ### Key reasoning

  1. **DOM setup belongs to the processor.** Whether it's sprae binding `:onclick` or the default processor cloning a template, DOM rendering is the processor's job. Scripts shouldn't do DOM setup.

  2. **No "no-processor mode" — there's a default processor.** The built-in template clone IS a processor. Custom processors (sprae, alpine) replace it. Script's relationship to the processor is always the same regardless.

  3. **Closure scope + onconnected solves persistence.** Scripts can declare persistent variables in the body, then populate them in `onconnected`:
    ```html
    <script>
      let btn  // persists across reconnects
      this.onconnected = () => { btn = this.querySelector('#btn') }
      this.ondisconnected = () => { btn = null }
    </script>
    ```
    No state loss on reconnect. `ondisconnected` can clean up.

  4. **Consistent with the platform.** In class-based CEs, nobody queries DOM in the constructor — they do it in `connectedCallback`. Our `onconnected` IS `connectedCallback`. The old pattern (DOM access in script body) was a convenience shortcut that conflated class body with connectedCallback.

  5. **Eliminates script/onconnected redundancy.** Previously both fired after render — two hooks for the same moment. Now they serve distinct purposes: script = setup, onconnected = DOM ready.

  6. **Enables React-like component pattern.** Methods defined in `<script>` are on the host before the processor runs. The processor can inject them into the template scope:
    ```html
    <script>
      this.format = function(v) { return `$${v}` }
    </script>
    <template>
      <span :text="format(count)"></span>
    </template>
    ```
    Uses `function` (not arrow) so processor can rebind `this` to reactive scope.

  ### Breaking change
  Existing scripts with top-level `this.querySelector(...)` need to move DOM access into `this.onconnected`. This is the correct SoC — was a shortcut before.

  ### Migration
  ```html
  <!-- before -->
  <script>
    let btn = this.querySelector('#btn')
    btn.onclick = () => this.count++
  </script>

  <!-- after -->
  <script>
    this.onconnected = () => {
      this.querySelector('#btn').onclick = () => this.count++
    }
  </script>
  ```
