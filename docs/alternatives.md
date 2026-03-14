# Alternatives

## Declarative

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

## JS-side

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

## Specs

* [Declarative Custom Elements Proposal](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md)
* [Template Instantiation Proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md)
* [Element Properties Proposal](https://github.com/nicegist/unified-element-properties-proposal)
* [HTML Modules (stalled)](https://github.com/nicegist/nicegist.github.io/blob/main/nicegist.html)
