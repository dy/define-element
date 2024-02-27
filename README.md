# define-element (proposal)

`<define-element>` - custom element to declare custom elements. (Similar to `<defs>` in SVG).

Getting existing things together in one ergonomic way.

```html
<define-element>
  <x-time>
    <template>{{ time.toLocaleTimeString() }}</template>

    <script scoped>
      let id
      this.onconnected = () => id = setInterval(() => this.params.time = new Date(), 1000)
      this.ondisconnected = () => clearInterval(id)
    </script>

    <style scoped>
      :host { font-family: monospace; }
    </style>
  </x-time>
</define-element>

<x-time></x-time>
```

### Features

* declarative custom elements
* declarative prop types
* declarative shadow dom
* scoped script
* scoped style
* `params` for changing template parts
* `props` for accessing / changing props
* template processor with expressions, loops and conditions
* `connected`, `disconnected` events
* slots
* baked-in reactivity

## Element Definition

Element is defined by-example (similar to `<defs>` in SVG) and may contain `<template>`, `<style>` and `<script>` sections.

```html
<define-element>
  <my-element prop:type="default">
    <template>
      {{ content }}
    </template>
    <style></style>
    <script></script>
  </my-element>

  <another-element>...</another-element>
</define-element>

<my-element></my-element>
```

Instances of `<element-name>` automatically receive defined attributes and content.

If `<template>` section isn't defined, the instance content preserved as is.

#### Why? 

Template-instantiation proposal naturally accomodates for template fields/parts, making it work outside of `<template>` tag would encounter many issues: [parsing table](https://github.com/github/template-parts/issues/24), [SVG attributes](https://github.com/github/template-parts/issues/25), [liquid syntax](https://shopify.github.io/liquid/tags/template/#raw) conflict etc.

Single `<define-element>` can define multiple custom elements.


## Props

Props with optional types are defined declaratively as custom element attributes:

```html
<define-element>
  <x-x count:number="0" flag:boolean text:string time:date value="default">
    <template>{{ count }}</template>
    <script scoped>
      console.log(this.props.count) // 0
      this.props.count++
      console.log(this.props.count) // 1
    </script>
  </x-x>
</define-element>
```

Available types are any primitives (attributes are case-agnostic):

* `:string` for _String_
* `:boolean` for _Boolean_
* `:number` for _Number_
* `:date` for _Date_
* `:array` for _Array_
* `:object` for _Object_
* no type for automatic detection

Props values are available under `element.props`.
Changing any of `element.props.*` is reflected in attributes.

See [element-props](https://github.com/spectjs/element-props).


## Template

`<template>` supports [template parts](https://github.com/w3c/webcomponents/blob/159b1600bab02fe9cd794825440a98537d53b389/proposals/Template-Instantiation.md#2-use-cases) with expressions:

```html
<define-element>
  <my-element>
    <template>
      <h1>{{ user.name }}</h1>Email: <a href="mailto:{{ user.email }}">{{ user.email }}</a>
    </template>
    <script scoped>
      this.params.user = { name: 'Harry Krishna', email: 'krishn@hari.om' }
    </script>
  </my-element>
</define-element>
```

Template part values are available as `element.params` object. Changing any of the `params.*` automatically rerenders the template.

Parts can potentially support reactive types as well: _Promise_/_Thenable_, _Observable_/_Subject_, _AsyncIterable_ etc. In that case update happens by changing the reactive state:

```html
<template>{{ count }}</template>
<script scoped>
  this.params.count = asyncIterator
</script>
```

See [template-parts](https://github.com/dy/template-parts) / [templize](https://github.com/dy/templize) - ponyfills for _Template-Parts_ proposal.

## Expressions

Supported syntax - eg. [justin](https://github.com/dy/subscript?tab=readme-ov-file#justin):

Part | Expression | Accessible as | Note
---|---|---|---
Value | `{{ foo }}` | `params.foo` |
Property | `{{ foo.bar?.baz }}`, `{{ foo["bar"] }}` | `params.foo.bar` |
Function call | `{{ foo(bar) }}` | `params.foo`, `params.bar` |
Method call | `{{ foo.bar() }}` | `params.foo.bar` |
Boolean operators | `{{ !foo && bar \|\| baz }}` | `params.foo`, `params.bar`, `params.baz` |
Ternary | `{{ foo ? bar : baz }}` | `params.foo`, `params.bar`, `params.baz` |
Primitives | `{{ "foo" }}`, `{{ true }}`, `{{ 0.1 }}` | |
Comparison | `{{ foo == 1 }}`, `{{ bar > foo }}` | `params.foo`, `params.bar` |
Math | `{{ a * 2 + b / 3 }}` | `params.a`, `params.b` |
Loop | `{{ item, idx in list }}` | `params.list` | Used for `:for` directive
Spread | `{{ ...foo }}` | `params.foo` | Used to pass multiple attributes or nodes

## Loops (tentative)

Iteration can be organized via `:for` directive:

```html
<define-element>
  <ul is="my-list">
    <template>
      <li :for="{{ item, index in items }}" id="item-{{ index }}">{{ item.text }}</li>
    </template>
    <script scoped>
      this.params.items = [1,2,3]
    </script>
  </ul>
</define-element>

<ul is="my-list"></ul>
```

Note that `index` starts with `1`, not `0`.

Cases:

```html
<li :for="{{ item, index in array }}">
<li :for="{{ key, value, index in object }}">
<li :for="{{ count in number }}">
```

## Conditions (tentative)

Conditions can be organized either as ternary template part or via `:if`, `:else-if`, `:else` directives.

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


## Script

There are two ways to attach scripts to the defined element.

_First_ is via `scoped` script attribute. That enables script to run with `this` defined as _element_ instance, instead of _window_. Also, it automatically exposes internal element references by `part`.

Script runs in `connectedCallback` with children and properties parsed and present on the element.
`scoped` attribute makes `this` point to the _element_ instance, instead of _window_.

```html
<define-element>
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
</define-element>
```

See `scoped` proposal discussions: [1](https://discourse.wicg.io/t/script-tags-scoped-to-shadow-root-script-scoped-src/4726/2), [2](https://discourse.wicg.io/t/proposal-chtml/4716/9) and [`<script scoped>` polyfill](https://gist.github.com/dy/2124c2dfcbdd071f38e866b85436c6c5) implementation.


_Second_ method is via custom element constructor, as proposed in [declarative custom elements](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md). It provides more granular control over constructor, callbacks and attributes.
At the same time, it would require manual control over children, props and reactivity.

```html
<define-element>
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
</define-element>
```


## Styles

Styles can be defined either globally or with `scoped` attribute, limiting CSS to only component instances.

```html
<define-element name="percentage-bar">
  <template shadowmode="closed">
    <div id="progressbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{root.attributes.percentage.value}}">
      <div id="bar" style="width: {{root.attributes.percentage.value}}%"></div>
      <div id="label"><slot></slot></div>
    </div>
  </template>
  <style scoped>
    :host { display: inline-block; }
    #progressbar { position: relative; display: block; width: 100%; height: 100%; }
    #bar { background-color: #36f; height: 100%; }
    #label { position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; text-align: center; }
  </style>
</define-element>
```

See [`<style scoped>`](https://github.com/samthor/scoped).


## Shadow DOM

Can be defined via `shadowrootmode` property (as in [declarative-shadow-dom](https://developer.chrome.com/docs/css-ui/declarative-shadow-dom))

```html
<my-element>
  <template shadowrootmode="closed"><template>
</my-element>
<my-element>
  <template shadowrootmode="open"><template>
</my-element>
```

## Slots

Content can be redirected either from instances or inheriting elements via slots mechanism:

```html
<define-element>
  <my-element>
    <template>
      <h1><slot name="title"></slot></h1>
      <p><slot name="content">{{ children }}</slot></p>
    </template>
  </my-element>
</define-element>

<my-element>
  <span slot="title">Hare Krishna!</span>
  <span slot="content">Srila Prabhupada Ki Jay!</span>
</my-element>
```


### Lifecycle events

There are `connected`, `disconnected` and `attributechanged` events generated to simplify instance lifecycle management. They're available as `onconnected`, `ondisconnected` and `onattributechanged` event handlers as well.

```html
<define-element>
  <x-element>
    <script scoped>
      // by default the script is run when instance is `connected`
      // to have children and attributes available

      this.onconnected = () => console.log('connected')
      this.ondisconnected = () => console.log('disconnected')
      this.onattributechanged = (e) => console.log('attributechanged', e.attributeChanged, e.newValue, e.oldValue)
    </script>
  </x-element>
</define-element>
```

See [disconnected](https://github.com/WebReflection/disconnected), [attributechanged](https://github.com/WebReflection/attributechanged).



## Examples

### Hello World

```html
<define-element>
  <welcome-user>
    <template>Hello, {{ name || '...' }}</template>
    <script scoped>
      this.params.name = await fetch('/user').json()
    </script>
  </welcome-user>
</define-element>

<welcome-user/>
```

### Timer

```html
<define-element>
  <x-timer start:number="0">
    <template>
      <time part="timer">{{ count }}</time>
    </template>
    <script scoped>
      this.params.count = this.props.start
      let id
      this.onconnected = () => id = setInterval(() => this.params.count++, 1000)
      this.ondisconnected = () => clearInterval(id)
    </script>
  </x-timer>
</define-element>

<x-timer start="0"/>
```

### Clock

```html
<define-element>
  <x-clock start:date>
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
</define-element>
...
<x-clock start="17:28"/>
```

### Counter

```html
<define-element>
  <x-counter count:number="0">
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
</define-element>

```

### Todo list

```html
<define-element>
  <todo-list>
    <template>
      <input part="text" placeholder="Add Item..." required>
      <button type="submit">Add</button>
      <ul class="todo-list">
        <li class="todo-item" :for="{{ item in todos }}">{{ item.text }}</li>
      </ul>
    </template>
    <script scoped>
      // initialize from child nodes
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
</define-element>

<todo-list>
  <li>A</li>
  <li>B</li>
</todo-list>
```

### Form validator

```html
<define-element>
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
</define-element>

<form is="validator-form"></form>
```

## Refs

* [element-modules](https://github.com/trusktr/element-modules)
* [EPA-WG custom-element](https://github.com/EPA-WG/custom-element)
* [vue3 single piece](https://github.com/vuejs/rfcs/blob/sfc-improvements/active-rfcs/0000-sfc-script-setup.md)
* [uce-template](https://github.com/WebReflection/uce-template#readme)
* [snuggsi](https://github.com/devpunks/snuggsi)
* [tram-lite](https://github.com/Tram-One/tram-lite)
* [tram-deco](https://github.com/Tram-One/tram-deco)
* [Declarative Custom Elements Proposal](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md)
* [Template Instantiation Proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md)

### License

ISC

<p align="center">🕉</p>
