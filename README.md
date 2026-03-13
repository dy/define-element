# define-element

A custom element to define custom elements.

```html
<define-element>
  <x-greeting name:string="world">
    <template>
      <p part="msg"></p>
    </template>
    <script>
      const update = () => this.part.msg.textContent = `Hello, ${this.name}!`
      update()
      this.onattributechanged = update
    </script>
    <style>
      :host { font-style: italic; }
    </style>
  </x-greeting>
</define-element>

<x-greeting></x-greeting>
<x-greeting name="Arjuna"></x-greeting>
```

Zero dependencies. ~1.5KB min+gz.


## Definition

Elements are defined by-example inside `<define-element>`. Each child becomes a custom element. A definition can contain `<template>`, `<script>`, and `<style>`.

```html
<define-element>
  <my-element greeting:string="hello">
    <template>...</template>
    <style>...</style>
    <script>...</script>
  </my-element>
</define-element>
```

Multiple definitions per block. After processing, `<define-element>` removes itself. Without `<template>`, instance content is preserved as-is.


## Props

Declared as attributes with optional types:

```html
<x-widget count:number="0" label:string="Click me" active:boolean>
```

| Type | Coercion | Default |
|------|----------|---------|
| `:string` | `String(v)` | `""` |
| `:number` | `Number(v)` | `0` |
| `:boolean` | `true` unless `"false"` or `null` | `false` |
| `:date` | `new Date(v)` | `null` |
| `:array` | `JSON.parse(v)` | `[]` |
| `:object` | `JSON.parse(v)` | `{}` |
| (none) | auto-detect | as-is |

Properties reflect to attributes and vice versa. Instance attributes override definition defaults.


## Template, Parts & Script

`<template>` is cloned into each instance on first connect. Elements with `part` are collected into `this.part`. `<script>` runs once per instance with `this` as the element, via script injection (no `eval`).

```html
<define-element>
  <x-clock>
    <template>
      <time part="display"></time>
    </template>
    <script>
      let id
      const tick = () => this.part.display.textContent = new Date().toLocaleTimeString()
      tick()
      this.onconnected = () => id = setInterval(tick, 1000)
      this.ondisconnected = () => clearInterval(id)
    </script>
    <style>:host { font-family: monospace; }</style>
  </x-clock>
</define-element>
```

| Access | Description |
|--------|-------------|
| `this` | The element instance |
| `this.count` | Prop value |
| `this.state` | Template state (from processor or plain object) |
| `this.part.x` | DOM ref via `part="x"` |
| `this.onconnected` | Connected callback |
| `this.ondisconnected` | Disconnected callback |
| `this.onadopted` | Adopted callback |
| `this.onattributechanged` | Attribute changed callback |

Script runs once on first connect. `onconnected` fires after script, including on first connect. On re-insertion, only `onconnected` fires. Async `await` is auto-detected.


## Style

`<style>` is scoped automatically. With shadow DOM, styles use [adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets) (shared across instances). Without shadow DOM, styles are wrapped in [`@scope`](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) and `:host` is rewritten to `:scope`.


## Shadow DOM & Slots

Add `shadowrootmode` to the template for encapsulation. Slots work natively:

```html
<define-element>
  <x-dialog open:boolean>
    <template shadowrootmode="open">
      <dialog part="dialog">
        <header><slot name="title">Notice</slot></header>
        <slot></slot>
        <footer><button part="close">Close</button></footer>
      </dialog>
    </template>
    <script>
      const sync = () => this.open ? this.part.dialog.showModal() : this.part.dialog.close()
      this.part.close.onclick = () => this.open = false
      this.onattributechanged = sync
      sync()
    </script>
    <style>
      dialog::backdrop { background: rgba(0,0,0,.5); }
      header { font-weight: bold; margin-bottom: .5em; }
      footer { margin-top: 1em; text-align: right; }
    </style>
  </x-dialog>
</define-element>

<x-dialog open>
  <span slot="title">Confirm</span>
  <p>Are you sure?</p>
</x-dialog>
```


## Processor

Pluggable template engine. Without a processor, templates are static HTML. Set `DefineElement.processor` to a `(root, state) => state` function — called once per instance after template cloning. Per-definition override via `define(el, processor)`.

```js
import DefineElement from 'define-element'
import sprae from 'sprae'

// sprae matches the signature directly — returns a reactive store
DefineElement.processor = sprae
```

```html
<define-element>
  <x-counter count:number="0">
    <template>
      <button :onclick="count++">
        Count: <span :text="count"></span>
      </button>
    </template>
  </x-counter>
</define-element>
```

No `<script>` needed — [sprae](https://github.com/dy/sprae) updates the template automatically when state changes. Other engines can be wrapped:

```js
// petite-vue (v-text, v-bind, {{ }})
import { createApp, reactive } from 'petite-vue'
DefineElement.processor = (root, state) => (createApp(state).mount(root), reactive(state))

// Alpine.js (x-text, x-bind, @click) — uses undocumented internals
import Alpine from 'alpinejs'
DefineElement.processor = (root, state) => {
  let r = Alpine.reactive(state)
  Alpine.addScopeToNode(root, r)
  Alpine.initTree(root)
  return r
}
```

Frameworks with their own component models (Lit, Vue, Stencil) are better used directly.


## JS API

```js
import { define } from 'define-element'

let el = document.createElement('x-widget')
el.setAttribute('count:number', '0')
el.innerHTML = '<template><span>widget</span></template>'
define(el)
```


## Why

The [DCE proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md) is stalling. The declarative CE space is a graveyard. JS-side solutions (Lit, FAST, Stencil) require build tools and class boilerplate.

The gap: no lightweight declarative approach that (1) plugs into a proven template engine and (2) provides standard web component props.


## Alternatives

### Declarative

| Project | Syntax | Reactivity | Status |
|---|---|---|---|
| [EPA-WG custom-element](https://github.com/EPA-WG/custom-element) | `<custom-element tag="x">`, `{attr}` interpolation, XPath expressions | XPath/XSLT data slices | Active, 306 dl/wk. No JS — declarative only. XPath foundation limits adoption. |
| [tram-deco](https://github.com/Tram-One/tram-deco) | `<template>` + `td-method="connectedCallback"` script blocks | None — imperative DOM manipulation | Barely alive, 15 dl/wk. Essentially a class spread across script tags. |
| [tram-lite](https://github.com/Tram-One/tram-lite) | `<template tl-definition>`, `${'attr'}` interpolation | Attribute mutation triggers re-render | Dead (abandoned 2025-01). Attributes-only state, everything is strings. |
| [uce-template](https://github.com/WebReflection/uce-template) | `<template is="uce-template">`, `{{x}}` interpolation | Proxy-based (`reactive()`) | Dead (no commits since 2021). ~10KB. `is=""` has no Safari support. |
| [W3C DCE Proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md) | `<definition name="x">`, `{{root.attributes.x.value}}` | Depends on Template Instantiation (also stalled) | Glacial — still gathering requirements, years from shipping. |
| [Ponys](https://github.com/jhuddle/ponys) | `<template name="x">` promoted to CE, `<script setup>` blocks | None — manual DOM manipulation | Low activity, 144 stars, ~19 dl/wk. ~1.2KB min. Thin wrapper over `customElements.define`. No reactivity. |
| [snuggsi](https://github.com/devpunks/snuggsi) | `` Element`tag-name`(class) ``, `{token}` text interpolation | Token rebind on event — full re-render, no fine-grained tracking | Low activity, ~400 stars, ~2.7k dl/wk. ~1KB gz. Unique tagged-template registration syntax. |
| [element-modules](https://github.com/trusktr/element-modules) | `<element name="x">` in `.html` files, `import ... with { type: 'element' }` | None | Concept only — not published to npm. 19 stars. Standards exploration for W3C CG, not a usable library. |

### JS-side

| Project | Size | Approach | Status |
|---|---|---|---|
| [Lit](https://lit.dev) | ~6KB | Class + `static properties`, tagged template rendering | Dominant. Google-backed. |
| [Stencil](https://stenciljs.com) | Compiler | Decorators (`@Prop`, `@State`), JSX, compile-time | Active. Ionic-backed. |
| [FAST Element](https://www.fast.design) | ~5KB | Class + `@attr`, template DSL | Active. Microsoft-backed. |
| [Catalyst](https://github.github.io/catalyst/) | ~1.9KB | Decorators (`@attr`, `@target`), maps to `data-*` attrs | Active. GitHub. No rendering opinion. |
| [Atomico](https://atomicojs.dev) | ~2.5KB | Functional `c()` wrapper, `{props: {name: String}}`, vDOM | Active. React-style hooks. |
| [Minze](https://minze.dev) | ~3KB | `reactive = [['name', default]]`, string `html()`/`css()` | Active. |
| [haunted](https://github.com/matthewp/haunted) | ~5KB | `component(fn)` wrapper, React hooks for WC | Low activity. |
| [Fuco](https://github.com/aspect-build/aspect-frameworks) | ~2-3KB | `defineElement(tag, fn)`, `useAttribute`/`useProperty` hooks | Dead. |
| [html-element-property-mixins](https://github.com/nicegist/html-element-property-mixins) | ~912B | Mixin composition (`ObservedProperties`, `ReflectedProperties`) | Low activity. Thinnest — property wiring only, zero rendering. |
| [Vue CE](https://vuejs.org/guide/extras/web-components.html) | ~18KB | `defineCustomElement()` wraps full Vue app per element — SFC, Composition API | Active. Full reactivity. Requires build tools for SFC. Heavy for single elements. |

### Specs

* [Declarative Custom Elements Proposal](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md)
* [Template Instantiation Proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md)
* [Element Properties Proposal](https://github.com/nicegist/unified-element-properties-proposal)
* [HTML Modules (stalled)](https://github.com/nicegist/nicegist.github.io/blob/main/nicegist.html)

### License

ISC

<p align="center">ॐ</p>
