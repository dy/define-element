# define-element [![npm](https://img.shields.io/npm/v/define-element?color=tomato)](https://npmjs.org/define-element) [![size](https://img.shields.io/bundlephobia/minzip/define-element?label=size&color=brightgreen)](https://bundlephobia.com/package/define-element) [![ci](https://github.com/dy/define-element/actions/workflows/test.yml/badge.svg)](https://github.com/dy/define-element/actions/workflows/test.yml)

A custom element to define custom elements.

* [Declarative Custom Elements](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md) reference implemetation
* Typed props, scoped styles, shadow DOM, slots, lifecycle — one `<script>` tag
* Native web components for [sprae](https://github.com/dy/sprae), [alpine](https://alpinejs.dev), [petite-vue](https://github.com/vuejs/petite-vue), [template-parts](https://github.com/nicegist/template-parts) and others


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
    <style>:host { font-style: italic }</style>
  </x-greeting>
</define-element>

<x-greeting></x-greeting>
<x-greeting name="Arjuna"></x-greeting>
```

```html
<script src="https://unpkg.com/define-element"></script>
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
| `this` | The element instance (in `<script>`) |
| `host` | The element instance (in processor templates) |
| `this.count` | Prop value |
| `this.state` | Template state (from processor or plain object) |
| `this.part.x` | DOM ref via `part="x"` |
| `this.onconnected` | Connected callback |
| `this.ondisconnected` | Disconnected callback |
| `this.onadopted` | Adopted callback |
| `this.onattributechanged` | Attribute changed callback |

Script runs once on first connect. `onconnected` fires after script, including on first connect. On re-insertion, only `onconnected` fires. Async `await` is auto-detected.


## Style

`<style>` is scoped automatically. With shadow DOM, styles use [adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets) (shared across instances). Without shadow DOM, styles are scoped via [CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) under the element tag, and `:host` is rewritten to the tag name.


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

Pluggable template engine. Without a processor, templates are static HTML (cloned automatically). With a processor, the processor owns template mounting — it receives an empty `root` with `root.template` pointing to the original `<template>` element, and is responsible for cloning/rendering content.

```js
processor(root, state) => state
```

- `root` — element (light DOM) or shadowRoot (shadow DOM), empty
- `root.template` — original `<template>` element (shared across instances)
- `state` — `{ host, propName: value }` from prop defaults + instance attributes
  - `host` — the CE element instance (reserved, do not declare as prop)
- Returns reactive state object (stored as `el.state`)

In light DOM, non-prop host attributes (parent directives like `:each`, `v-text`, `x-bind`) are temporarily stripped during processor execution so the processor doesn't process them. Shadow DOM doesn't need this — the ShadowRoot is naturally isolated from host attributes.

```js
let DE = customElements.get('define-element')

// sprae — clone template, then sprae processes content reactively
import sprae from 'sprae'
DE.processor = (root, state) => {
  root.appendChild(root.template.content.cloneNode(true))
  return sprae(root, state)
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
// @github/template-parts — renders directly from template, no pre-clone needed
import { TemplateInstance } from '@github/template-parts'
DE.processor = (root, state) => {
  root.replaceChildren(new TemplateInstance(root.template, state))
  return state
}

// petite-vue
import { createApp, reactive } from 'petite-vue'
DE.processor = (root, state) => {
  root.appendChild(root.template.content.cloneNode(true))
  let r = reactive(state)
  createApp(r).mount(root)
  return r
}

// Alpine.js
import Alpine from 'alpinejs'
DE.processor = (root, state) => {
  root.appendChild(root.template.content.cloneNode(true))
  let r = Alpine.reactive(state)
  Alpine.addScopeToNode(root, r)
  Alpine.initTree(root)
  return r
}
```

Frameworks with their own component models (Lit, Vue, Stencil) are better used directly.


## Progressive Enhancement

Definitions are plain HTML — they render as inert content before JS loads. No flash of unstyled content, no blank page. The component markup is the fallback.

For shadow DOM components, server-rendered HTML can include [Declarative Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM#declaratively_with_html) (`<template shadowrootmode>`) for instant first paint. `define-element` then hydrates behavior on top.

This is not server-side rendering in the framework sense — there is no server runtime. It is HTML that works without JavaScript and gets enhanced when JavaScript arrives.


## Why

The [W3C Declarative Custom Elements proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md) has stalled for years. JS-side solutions (Lit, FAST, Stencil) require build tools and class boilerplate. The declarative CE space is a [graveyard](./docs/alternatives.md).

The gap: no lightweight way to define a custom element as HTML — components as content, not as code. Paste a `<define-element>` block into any page, CMS, or markdown file and it works. No npm, no import maps, no build step. One `<script>` tag.

This ~270-line reference implementation is evidence that the W3C proposal is implementable and useful. Ship it natively.


## Alternatives

<sup>[EPA-WG custom-element](https://github.com/EPA-WG/custom-element) · [tram-deco](https://github.com/Tram-One/tram-deco) · [tram-lite](https://github.com/Tram-One/tram-lite) · [uce-template](https://github.com/WebReflection/uce-template) · [Ponys](https://github.com/jhuddle/ponys) · [snuggsi](https://github.com/devpunks/snuggsi) · [element-modules](https://github.com/trusktr/element-modules) · [Lit](https://lit.dev) · [Stencil](https://stenciljs.com) · [FAST](https://www.fast.design) · [Catalyst](https://github.github.io/catalyst/) · [Atomico](https://atomicojs.dev) · [Minze](https://minze.dev) · [haunted](https://github.com/matthewp/haunted) · [W3C DCE Proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md)</sup>

[Detailed comparison →](./docs/alternatives.md)


### License

[Krishnized](https://github.com/krishnized/license) ISC

<p align="center"><a href="https://github.com/krishnized/license">ॐ</a></p>
