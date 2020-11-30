# element-defs

Define custom elements declaratively, like `<defs>` for HTML.
Ref [spect#240](https://github.com/spectjs/spect/issues/240).

Sweet parts:

* proposal-compatible
* shadow dom
* :sugar: scoped script for shorter init
* :sugar: scoped style
* :sugar: sandboxed script
* `params` for changing template parts
* `parts` to access template elements
* optional `template`
* template processor with `:each`, `:if` directives

- [`<script scoped>`](https://gist.github.com/dy/2124c2dfcbdd071f38e866b85436c6c5)
- [`<style scoped>`](https://github.com/samthor/scoped)
- [element.props](https://github.com/spectjs/element-props)
- [template parts](https://github.com/github/template-parts) take exported values (they're live out of the box!)
- [disconnected](https://www.npmjs.com/package/disconnected)
- [`<script setup>`](https://github.com/vuejs/rfcs/blob/sfc-improvements/active-rfcs/0000-sfc-script-setup.md) by default


```html
<element-defs>
  <x-time time:Date interval:String>
    <template shadowmode="open">{{ time.toLocaleTimeString() }}</template>

    <script setup scoped type="module">
      let id
      this.onconnected = () => id = setInterval(() => time = new Date(), 1000)
      this.ondisconnected = () => clearInterval(id)
    </script>

    <style scoped>
      :host {}
    </style>
  </x-time>
</element-defs>

<x-time start="2020-02-02"/>
```


## Documentation

### Element Definition

Element is defined by example and may contain `template`, `style` and `script` parts.

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

This way, instantiated `<element-name>` automatically receives attributes and content, defined in the template.

`<template>` element is optional and defines what child content must be rendered. If not defined, the content is passed from the instance.

There can be multiple template, script and style tags.


### Properties / Prop Types

Properties and/or prop types are defined in either of two ways.

_1._ As default export from setup script (similar to vue):

```html
  <x-x>
    ...
    <script setup type="module">
      export default {
        count: parseInt,
        b: Boolean,
        c: String,
        d: Date,
        e: null
      }
    </script>
  </x-x>
```

_2._ As custom element attributes with optional types and default values:

```html
  <x-x count:int="0" b:boolean c:string d:date e>
    ...
    <script scoped>
      console.log(this.props.count) // 0
    </script>
  </x-x>
```

Type case doesn't matter in case of attributes. Also attributes support `float`, `int` and `bool` helper type keywords.

Supported types are any of the primitives:

* _String_
* _Date_
* _Boolean_
* _Number_
* _Array_
* _Object_

Or a function returning string, like `JSON.parse`, `parseInt`, `parseFloat` etc.

Default value is automatically converted to the indicated type.

If type is not defined, it's chosen between `number`, `boolean` or `` automatically.

Properties can be read as:

```js
element.props.count
```

Properties are reflected automatically as attributes.


### Template Parts

`<template>` supports [template parts](https://github.com/w3c/webcomponents/blob/159b1600bab02fe9cd794825440a98537d53b389/proposals/Template-Instantiation.md#2-use-cases) via [polyfill](https://github.com/github/template-parts) with elaborate processor:

```html
<element-defs>
  <my-element>
    <template>
      <h1>{{ user.name }}</h1>Email: <a href="mailto:{{ user.email }}">{{ user.email }}</a>
    </template>
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
Pipe | `{{ bar \|> foo }}` | `params.foo`, `params.bar` | Same as `{{ foo(bar) }}`
Default fallback | `{{ foo ?? bar }}` | `params.foo`, `params.bar` |
Inversion | `{{ !foo }}` | `params.foo` |
Ternary | `{{ foo ? bar : baz }}` | `params.foo`, `params.bar`, `params.baz` |
Primitive literals | `{{ 'foo' }}`, `{{ true }}`, `{{ 0.1 }}` | |
Boolean operators | `{{ foo && bar \|\| baz }}` | `params.foo`, `params.bar`, `params.baz` |
Comparison | `{{ foo === 1 }}` | `params.foo` |
Spread | `{{ ...foo }}` | `params.foo` | Used to pass multiple attributes or nodes

Changing any of the `params` automatically rerenders the template.

Parts support reactive types as well: _Promise_, _Observable_, _AsyncIterable_, _Function_ in which case update happens by changing the reactive state:

```js
<template>{{ count }}</template>
<script scoped>
  this.params.count = asyncIterator
</script>
```

This way, for example, rxjs can be streamed directly to the template.
Null or false parts remove attribute.
Once template parts are shipped natively in browser, the polyfill is expected to be removed.

Parts can be alternatively exported in setup script as live bindings, changing reactively:

```html
<script setup>
export let count = 1

// update count value
count = 2
</script>
```


### Scripts

There are two ways to attach scripts to the defined element.

_First_ is via `scoped` script attribute. That enables script to run with `this` defined as _element_ instance, instead of _window_. Also, it automatically exposes internal element references by `part`.

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

The scoped script is run in `connectedCallback` with children and properties parsed and present on the element.

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

Iteration is organized via `:each` directive as follows:

```html
<ul is=my-list>
  <template>
    <li :each="{{ item in items }}">{{ item.text }}</li>
  </template>
  <script scoped>
    this.params.items = [1,2,3]
  </script>
</ul>

<ul is=my-list></ul>
```

It may take either iterable param or a number, in which case it will be used as counter:

```html
<span :each="{{ i in 10 }}">.</span>
```

Note that item name is optional.

Cases:

```html
<li :each="{{ item, index in array }}">
<li :each="{{ key, value in object }}">
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
