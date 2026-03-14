## Done

* [x] template processor — pluggable `(root, state) => state`
* [x] element-props — `name:type="default"` syntax
* [x] element-parts — `this.part` via `part` attribute
* [x] `<script>` — per-instance with `this` binding, via script injection
* [x] `<style>` — shadow DOM via adoptedStyleSheets, light DOM via CSS nesting
* [x] drop `scoped` attribute — all script/style inside definition is component-scoped

## Out of scope

* `<script sandbox>` — would need iframe/realm isolation, YAGNI
* import maps via service workers — orthogonal to component definition
* `<template immediate>` — solved by slots in shadow DOM
* `<script inline>` — solved by script injection approach
* SVG `{{}}` edge cases — processor-specific, not define-element's concern
