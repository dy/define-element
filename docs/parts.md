# Parts

Some real-case scenarios enforce custom elements definition where concerns are smaller.

* [ ] `<script scoped>` - can be fully autonomous and reside in any tag
* [ ] `<template deploy>` (or alike) - for immediate insertion, to provide template parts to any DOM.
  * btw that's naturally solved via slots as `<template slot="parent-el-slot">` - that immediately deploys target content
* [ ] `<script inline>` - MO is run before the script is evaluated, therefore it is possible to rewire as indicated here
* [ ] template processor, possibly composable as `<template type="each-if-or-and-calc-prop">`
  - simpler to just have tiny elaborate one rather than force user enable features
* [x] element-props
* [ ] element-parts
* [ ] `<script sandbox>`
  - meaningful within custom element only
* [ ] import maps via service workers (or somehow else?)
