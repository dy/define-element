# element-defs

`<element-defs>` is a custom element, enabling declarative custom elements for HTML, like `<defs>` in SVG.

### Sweet parts

* declarative custom elements
* declarative prop types
* declarative shadow dom
* scoped script
* scoped style
* sandboxed script (coming)
* `params` for changing template parts
* `parts` for access to template elements
* `props` for accessing / changing props
* elaborate template processor with loops & conditionals
* `connected`, `disconnected` events

<!-- - [disconnected](https://www.npmjs.com/package/disconnected) -->

```html
<element-defs>
  <x-time>
    <template>{{ time.toLocaleTimeString() }}</template>

    <script scoped>
      let id = setInterval(() => this.props.time = new Date(), 1000)

      this.ondisconnected = () => clearInterval(id)
    </script>

    <style scoped>
      :host { font-family: monospace; }
    </style>
  </x-time>
</element-defs>

<x-time></x-time>
```


## Documentation

### Element Definition

Element is defined by-example (similar to `<defs>` in SVG) and may contain `<template>`, `<style>` and `<script>` sections.

```html
<element-defs>
  <element-name prop:type="default">
    <template>
      {{ content }}
    </template>
    <style></style>
    <script></script>
  </element-name>

  <another-element>...</another-element>
</element-defs>

<element-name></element-name>
```

Instances of `<element-name>` automatically receive defined attributes and content.

If `<template>` section isn't defined, the instance content preserved as is.


### Properties / Prop Types

Properties and/or prop types are defined declaratively as custom element attributes:

```html
<element-defs>
  <x-x count:number="0" flag:boolean text:string time:date value>
    <template>{{ count }}</template>
    <script scoped>
      console.log(this.props.count) // 0
      this.props.count++
      console.log(this.props.count) // 1
    </script>
  </x-x>
</element-defs>
```

Available types are any primitives (attribute case doesn't matter):

* `:string` for _String_
* `:boolean` for _Boolean_
* `:number` for _Number_
* `:date` for _Date_
* `:array` for _Array_
* `:object` for _Object_ via `JSON.parse`
* no type for automatic detection

<!-- * `:int` for _Number_ via `parseInt` -->
<!-- * `:time` for _Date_ with days cutoff -->
<!-- * `:list` for _Array_ from CSV -->

Instance props values are available under `element.props`, changing any of `element.props.*` is reflected in attributes.

See [element-props](https://github.com/spectjs/element-props).


### Template Parts

`<template>` supports [template parts](https://github.com/w3c/webcomponents/blob/159b1600bab02fe9cd794825440a98537d53b389/proposals/Template-Instantiation.md#2-use-cases) with elaborate processor:

```html
<element-defs>
  <my-element>
    <template>
      <h1>{{ user.name }}</h1>Email: <a href="mailto:{{ user.email }}">{{ user.email }}</a>
    </template>
    <script scoped>
      this.params.user = { name: 'Harry Krishna', email: 'krishn@hari.om' }
    </script>
  </my-element>
</element-defs>
```

The processor supports the following expressions:

Part | Expression | Accessible as | Note
---|---|---|---
Value | `{{ foo }}` | `params.foo` |
Property | `{{ foo.bar }}` | `params.foo.bar` | Property access is path-safe and allows null-ish paths
Function call | `{{ foo(bar) }}` | `params.foo`, `params.bar` | Only function invocation is supported, not properties
Method call | `{{ foo.bar() }}` | `params.foo.bar` | Cannot be called via `.call` or `.apply`
<!-- Pipe | `{{ bar \|> foo }}` | `params.foo`, `params.bar` | Same as `{{ foo(bar) }}` -->
Default fallback | `{{ foo ?? bar }}` | `params.foo`, `params.bar` |
Inversion | `{{ !foo }}` | `params.foo` |
Ternary | `{{ foo ? bar : baz }}` | `params.foo`, `params.bar`, `params.baz` |
Primitive literals | `{{ 'foo' }}`, `{{ true }}`, `{{ 0.1 }}` | |
Boolean operators | `{{ foo && bar \|\| baz }}` | `params.foo`, `params.bar`, `params.baz` |
Comparison | `{{ foo === 1 }}` | `params.foo` |
<!-- Spread | `{{ ...foo }}` | `params.foo` | Used to pass multiple attributes or nodes -->
Loop | `{{ a, b, c in d }}` | `params.d` | Used for `:each` directive only
Math | `{{ a * 2 + b / 3 }}` | `params.a`, `params.b` | Only CSS calc operators are supported, the result is expected to be only numeric

Parsed template parts are available as `element.params` object. Changing any of the `params.*` automatically rerenders the template.

Parts support reactive types as well: _Promise_, _Observable_, _AsyncIterable_, in that case update happens by changing the reactive state:

```js
<template>{{ count }}</template>
<script scoped>
  this.params.count = asyncIterator
</script>
```

This way, for example, rxjs can be streamed directly to the template.

Template parts are implemented via [polyfill](https://github.com/github/template-parts), when shipped natively the polyfill is expected to be removed.


### Script

<!-- There are two ways to attach scripts to the defined element. -->
<!-- _First_ is via `scoped` script attribute. That enables script to run with `this` defined as _element_ instance, instead of _window_. Also, it automatically exposes internal element references by `part`. -->

Script runs in `connectedCallback` with children and properties parsed and present on the element. If `scoped` attribute is present, `this` points to the _element_ instance, instead of _window_.

```html
<element-defs>
  <main-header content:string>
    <template>
      <h1 part="header">{{ content }}</h1>
    </template>
    <script scoped>
      this // my-element
      this.parts.header // h1
      this.params.content
      this.props.content
    </script>
  </main-header>
</element-defs>
```
<!--

_Second_ method is via custom element constructor, as proposed in [declarative custom elements](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md). It provides more granular control over constructor, callbacks and attributes.
At the same time, it would require manual control over children, props and reactivity.

```html
<element-defs>
  <my-element>
    <template></template>
    <script type="module">
      export default class MyCustomElement extends HTMLElement {
        constructor() {
          super()
        }
        connectedCallback() {}
        disconnectedCallback() {}
      }
    </script>
  </my-element>
</element-defs>
```
-->

See proposal discussions: [1](https://discourse.wicg.io/t/script-tags-scoped-to-shadow-root-script-scoped-src/4726/2), [2](https://discourse.wicg.io/t/proposal-chtml/4716/9) and [`<script scoped>` polyfill](https://gist.github.com/dy/2124c2dfcbdd071f38e866b85436c6c5) implementation.


### Styles

Styles can be defined either globally or with `scoped` attribute, limiting CSS to only component instances.

```html
<element-defs name="percentage-bar">
  <template shadowmode="closed">
    <div id="progressbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{root.attributes.percentage.value}}">
      <div id="bar" style="width: {{root.attributes.percentage.value}}%"></div>
      <div id="label"><slot></slot></div>
    </div>
  </template>
  <style scoped>
    :host { display: inline-block !important; }
    #progressbar { position: relative; display: block; width: 100%; height: 100%; }
    #bar { background-color: #36f; height: 100%; }
    #label { position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; text-align: center; }
  </style>
</element-defs>
```

See [`<style scoped>`](https://github.com/samthor/scoped).


### Shadow DOM

Can be defined via `shadowmode` property.

```html
<my-element>
  <template shadowmode="closed"><template>
</my-element>
<my-element>
  <template shadowmode="open"><template>
</my-element>
```

### Loops

Iteration is organized via `:each` directive:

```html
<element-defs>
  <ul is=my-list>
    <template>
      <li :each="{{ item, index in items }}" id="item-{{ index }}">{{ item.text }}</li>
    </template>
    <script scoped>
      this.params.items = [1,2,3]
    </script>
  </ul>
</element-defs>

<ul is=my-list></ul>
```

Note that `index` starts with `1`, not `0`.

Cases:

```html
<li :each="{{ item, index in array }}">
<li :each="{{ key, value, index in object }}">
<li :each="{{ count in number }}">
```

### Conditions

Conditionals can be organized either as ternary template part or via `:if`, `:else-if`, `:else` directives.

For text variants ternary operator is shorter:

```html
<span>Status: {{ status === 0 ? 'Active' : 'Inactive' }}</span>
```

To optionally display an element, use `:if`-`:else-if`-`:else`:

```html
<span :if="{{ status === 0 }}">Inactive</span>
<span :else-if="{{ status === 1 }}">Active</span>
<span :else>Finished</span>
```


## Examples

### Hello World

```html
<element-defs>
  <welcome-user>
    <template>Hello, {{ name ?? 'guest' }}</template>
    <script scoped>
      this.params.name = await fetch('/user')).json()
    </script>
  </welcome-user>
</element-defs>

<welcome-user/>
```

### Timer

```html
<element-defs>
  <x-timer>
    <template>
      <time part="timer">{{ count }}</time>
    </template>
    <script scoped>
      this.params.count = this.props.start || 0
      let id
      this.onmount = () => id = setInterval(() => this.params.count++, 1000)
      this.onunmount = () => clearInterval(id)
    </script>
  </x-timer>
</element-defs>

<x-timer start="0"/>
```

### Clock

```html
<script src="...element-template.js"></script>
...
<element-defs>
  <x-clock>
    <template>
      <time datetime="{{ time }}">{{ time.toLocaleTimeString() }}</time>
    </template>
    <script scoped>
      this.params.time = this.props.start || new Date();
      let id
      this.onconnected = () => id = setInterval(() => this.params.time = new Date(), 1000)
      this.ondisconnected = () => clearInterval(id)
    </script>
    <style scoped>
      :host {}
    </style>
  </x-clock>
</element-defs>
...
<x-clock start="17:28"/>
```

### Counter

```html
<element-defs>
  <x-counter>
    <template>
      <output>{{ count }}</output>
      <button part="inc">+</button>
      <button part="dec">‐</button>
    </template>
    <script scoped>
      this.parts.inc.onclick = e => this.props.count++
      this.parts.dec.onclick = e => this.props.count--
    </script>
  </x-counter>
</element-defs>

```

### Todo list

```html
<element-defs>
  <todo-list>
    <template>
      <input part="text" placeholder="Add Item..." required>
      <button type="submit">Add</button>
      <ul class="todo-list">
        <li class="todo-item" :each="{{ item in todos }}">{{ item.text }}</li>
      </ul>
    </template>
    <script sandbox>
      this.params.todos = this.children.map(child => {text: child.textContent})
      this.parts.text.onsubmit = e => {
        e.preventDefault()
        if (form.checkValidity()) {
          this.params.todos.push({ text: this.parts.text.value })
          form.reset()
        }
      }
    </script>
  </todo-list>
</element-defs>

<todo-list>
  <li>A</li>
  <li>B</li>
</todo-list>
```

### Form validator

```html
<element-defs>
  <form is="validator-form">
    <template shadowroot="closed">
      <label for=email>Please enter an email address:</label>
      <input id="email">
      <span :if="{{ !valid }}">The address is invalid</span>
    </template>

    <script scoped type="module">
      const isValidEmail = s => /.+@.+\..+/i.test(s);
      export default class ValidatorForm extends HTMLFormElement {
        constructor () {
          this.email.onchange= e => this.params.valid = isValidEmail(e.target.value)
        }
      }
    </script>
  </form>
</element-defs>

<form is="validator-form"></form>
```

## Similar

* [vue3 single piece](https://github.com/vuejs/rfcs/blob/sfc-improvements/active-rfcs/0000-sfc-script-setup.md)
* [uce-template](https://github.com/WebReflection/uce-template#readme)
* [declarative custom elements](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md)
* [snuggsi](https://github.com/devpunks/snuggsi)


### License

ISC
