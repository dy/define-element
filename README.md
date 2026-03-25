# define-element [![npm](https://img.shields.io/npm/v/define-element?color=tomato)](https://npmjs.org/define-element) [![size](https://img.shields.io/bundlephobia/minzip/define-element?label=size&color=brightgreen)](https://bundlephobia.com/package/define-element) [![ci](https://github.com/dy/define-element/actions/workflows/test.yml/badge.svg)](https://github.com/dy/define-element/actions/workflows/test.yml)

A custom element to define custom elements.

* Implements the [Declarative Custom Elements](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md) concept — define web components in HTML
* Typed props, scoped styles, shadow DOM, slots, lifecycle events
* Web components for [alpine](https://alpinejs.dev), [petite-vue](https://github.com/vuejs/petite-vue), [template-parts](https://github.com/nicegist/template-parts), [sprae](https://github.com/dy/sprae), and others


```html
<script src="https://unpkg.com/define-element"></script>
```

```html
<define-element>
  <x-greeting name:string="world">
    <template>
      <p id="msg"></p>
    </template>
    <script>
      this.onpropchange = () =>
        this.querySelector('#msg').textContent = `Hello, ${this.name}!`
      this.onconnected = () => this.onpropchange()
    </script>
    <style>:host { font-style: italic }</style>
  </x-greeting>
</define-element>

<x-greeting></x-greeting>
<x-greeting name="Arjuna"></x-greeting>
```

or `$ npm i define-element` → `import 'define-element'`


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

Multiple definitions supported. After processing, `<define-element>` removes itself. Without `<template>`, instance content is preserved as-is.


## Props

Attributes are strings. Optional type suffix defines coercion. No suffix auto-detects type from value. Plain values (`string`, `number`, `boolean`, `date`) reflect back to attributes.

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

Primitive props reflect to attributes and vice versa. Array/object props are property-only (no attribute reflection). Instance attributes override definition defaults.


## Template & Script

`<script>` runs once per instance at creation. `this` is the element. `<template>` is then cloned and rendered (by the processor or literally). Lifecycle callbacks `onconnected`, `ondisconnected`, `onpropchange` fire when the element is attached, removed, or any property changes. No `eval`; scripts run via element injection.

```html
<define-element>
  <x-clock>
    <template>
      <time id="display"></time>
    </template>
    <script>
      let id, display  // persistent closure scope
      const tick = () => display.textContent = new Date().toLocaleTimeString()
      this.onconnected = () => {
        display = this.querySelector('#display')
        tick()
        id = setInterval(tick, 1000)
      }
      this.ondisconnected = () => clearInterval(id)
    </script>
    <style>:host { font-family: monospace; }</style>
  </x-clock>
</define-element>
```

| Access | Description |
|--------|-------------|
| `this` | The element instance (in `<script>`) |
| `host` | The element instance (in processor templates) |
| `this.count` | Prop value (getter/setter) |
| `this.props` | Prop values object (source of truth) |
| `this.onpropchange` | Prop changed callback `(name, val)` |
| `this.onconnected` | DOM ready callback (fires on every connect) |
| `this.ondisconnected` | Disconnected callback |
| `this.onadopted` | Adopted callback |

Script runs once before render — like a class body. `onconnected` fires after render on every connect — like `connectedCallback`. Async `await` is auto-detected.


## Style

`<style>` is scoped automatically. Without shadow DOM — via [CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting), `:host` rewrites to the tag name. With shadow DOM — styles are fully isolated, shared across instances via [adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets).


## Shadow DOM & Slots

Add `shadowrootmode` to the template for encapsulation. Slots work natively:

```html
<define-element>
  <x-dialog open:boolean>
    <template shadowrootmode="open">
      <dialog id="dialog">
        <header><slot name="title">Notice</slot></header>
        <slot></slot>
        <footer><button id="close">Close</button></footer>
      </dialog>
    </template>
    <script>
      let dlg, close
      const sync = () => this.open ? dlg.showModal() : dlg.close()
      this.onpropchange = sync
      this.onconnected = () => {
        dlg = this.shadowRoot.querySelector('#dialog')
        close = this.shadowRoot.querySelector('#close')
        close.onclick = () => this.open = false
        sync()
      }
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

Without a processor, templates are static HTML — cloned automatically, you wire DOM by hand. Set `DE.processor` to plug in any template engine; reactive bindings replace querySelector boilerplate.

> **Note:** There is one global processor at a time. Setting `DE.processor` applies to all `<define-element>` definitions. If you need different template engines for different components, choose one and use manual DOM wiring for the rest.

```js
processor(root, state) => void
```

- `root` — element (light DOM) or shadowRoot (shadow DOM), empty, with `root.template`
- `state` — `{ host, ...propValues }` snapshot from prop defaults + instance attributes
- `host.onpropchange` — set this to receive prop updates: `(name, val) => {}`

In light DOM, non-prop host attributes (parent directives like `:each`, `v-text`, `x-bind`) are temporarily stripped during processor execution so the processor doesn't process them.

```js
let DE = customElements.get('define-element')

// sprae
import sprae from 'sprae'
DE.processor = (root, state) => {
  root.appendChild(root.template.content.cloneNode(true))
  let s = sprae(root, state)
  state.host.onpropchange = (k, v) => s[k] = v
}
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

No `<script>` needed — [sprae](https://github.com/dy/sprae) updates the template automatically when state changes. Other processors:

```js
// @github/template-parts
import { TemplateInstance } from '@github/template-parts'
DE.processor = (root, state) => {
  root.replaceChildren(new TemplateInstance(root.template, state))
}

// petite-vue
import { createApp, reactive } from 'petite-vue'
DE.processor = (root, state) => {
  root.appendChild(root.template.content.cloneNode(true))
  let r = reactive(state)
  createApp(r).mount(root)
  state.host.onpropchange = (k, v) => { r[k] = v }
}

// Alpine.js
import Alpine from 'alpinejs'
DE.processor = (root, state) => {
  root.appendChild(root.template.content.cloneNode(true))
  let r = Alpine.reactive(state)
  Alpine.addScopeToNode(root, r)
  Alpine.initTree(root)
  state.host.onpropchange = (k, v) => { r[k] = v }
}
```

Frameworks with their own component models (Lit, Vue, Stencil) are better used directly.


## Why

The [W3C Declarative Custom Elements proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md) has [stalled for years](https://github.com/w3c/webcomponents-cg/issues/81) over template syntax disagreements. The [polyfill attempts](./docs/alternatives.md) are mostly dead. So you either write boilerplate or avoid custom elements.

`<define-element>` fills the gap: include the script and write custom elements as HTML. It doesn't impose a template engine or framework — use your favorite one, or just wire DOM by hand.

This ~200-line implementation demonstrates that the W3C proposal is viable and useful. If it ships natively, this becomes unnecessary.


## Alternatives

<sup>[EPA-WG custom-element](https://github.com/EPA-WG/custom-element) · [tram-deco](https://github.com/Tram-One/tram-deco) · [tram-lite](https://github.com/Tram-One/tram-lite) · [uce-template](https://github.com/WebReflection/uce-template) · [Ponys](https://github.com/jhuddle/ponys) · [snuggsi](https://github.com/devpunks/snuggsi) · [element-modules](https://github.com/trusktr/element-modules) · [Lit](https://lit.dev) · [Stencil](https://stenciljs.com) · [FAST](https://www.fast.design) · [Catalyst](https://github.github.io/catalyst/) · [Atomico](https://atomicojs.dev) · [Minze](https://minze.dev) · [haunted](https://github.com/matthewp/haunted) · [W3C DCE Proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md)</sup>

[Detailed comparison →](./docs/alternatives.md)


## Limitations

- **Async scripts:** `await` in `<script>` defers everything after it to a microtask. Assign lifecycle callbacks (`onconnected`, `onpropchange`) before the first `await`, or they won't be set when the element first renders.
- **Closed DSD:** Declarative shadow DOM with `shadowrootmode="closed"` works for programmatically created elements. But if the browser consumes a closed DSD template during HTML parsing (on either definition or instance elements), the shadow root is inaccessible — use `open` mode instead.
- **Safari `is=""`:** Customized built-in elements (`<ul is="x-sortable">`) are not supported in Safari and never will be.
- **Single processor:** `DE.processor` is global — one template engine at a time. Components that need manual DOM wiring can coexist by using `<script>` blocks instead of processor directives.


### License

[Krishnized](https://github.com/krishnized/license) ISC

<p align="center"><a href="https://github.com/krishnized/license">ॐ</a></p>
