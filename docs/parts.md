# Parts

Some real-case scenarios enforce custom elements definition where concerns are smaller.

* [ ] `<script scoped>` - can be fully autonomous and reside in any tag
* [ ] `<template immediate>` (or alike) - for immediate insertion, to provide template parts to any DOM.
  * btw that's naturally solved via slots as `<template slot="parent-el-slot">` - that immediately deploys target content
* [ ] `<script inline>` - MO is run before the script is evaluated, therefore it is possible to rewire as indicated here
* [x] template processor, possibly composable as `<template type="each-if-or-and-calc-prop">`
  - simpler to just have tiny elaborate one rather than force user enable features
  → templized, subscript
* [x] element-props
* [x] ~~element-parts~~ → implemented natively
* [ ] `<script sandbox>`
  - meaningful within custom element only
* [ ] import maps via service workers (or somehow else?)
