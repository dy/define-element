# element-template

Declaratively define custom elements.
Based on [template parts proposal](), [declarative custom elements proposal](), [element-props]() and some opinionated know-hows.
Inspired by [uce-template](), [vue3 single piece]().


```html
<script src="path/to/element-template.js"></script>

<template is="define-element">
  <x-counter start:number="0">
    {{ count }}
    <button id="inc">+</button>
    <button id="dec">-</button>
  </x-counter>
  <script scoped>
    inc.onclick = this.params.count++
    dec.onclick = this.params.count--
  </script>
</template>
```

## Documentation

### Element Declaration

Elements are declared by-example, the method is introduced by [uce-template](https://ghub.io/uce-template).

```html
<template is="define-element">
  <my-element prop>{{ content }}</my-element>
</template>

<my-element></my-element>
```

This way, instantiated `my-element` automatically receives attributes and content, defined in the template.

There can be only one custom element tag defined in the template, one script and one style.


### Template Parts

Following [template parts proposal](https://github.com/w3c/webcomponents/blob/159b1600bab02fe9cd794825440a98537d53b389/proposals/Template-Instantiation.md#2-use-cases) use-cases, it implements simplified subset:

```html
<template is="define-element">
  <x-author>
    <section>
      <h1>{{ user.name }}</h1>Email: <a href="mailto:{{ user.email }}">{{ user.email }}</a>
    </section>
  </x-author>
</template>
```

It parses / supports basic template expressions:

Part | Expression | Accessible as | Note
---|---|---|---
Direct access | `{{ foo }}` | `params.foo` |
Property access | `{{ foo.bar }}` | `params.foo.bar` | Property access is safe, it can access possibly null-ish paths
Function call | `{{ foo(bar) }}` | `params.foo`, `params.bar` |
Method call | `{{ foo.bar() }}` | `params.foo.bar` | Cannot be called via `.call` or `.apply`
Default fallback | `{{ foo ?? bar }}` | `params.foo`, `params.bar` |
Inversion | `{{ !foo }}` | `params.foo` |
Ternary | `{{ foo ? bar : baz }}` | `params.foo`, `params.bar`, `params.baz` |
Primitive literals | `{{ 'foo' }}`, `{{ true }}`, `{{ 0.1 }}` | |
Boolean operators | `{{ foo && bar || baz }}` | `params.foo`, `params.bar`, `params.baz` |
Comparison | `{{ foo === 1 }}` | `params.foo` |
Spread | `{{ ...foo }}` | `params.foo` | Used to pass multiple attributes or nodes

Updating template parts can done via `el.params` object. Setting any part automatically rerenders the element.

Parts support reactive types as well: _Promise_, _Observable_, _AsyncIterable_, _Function_.

```js
{{ count }}
el.params.count = asyncIterator
```

In this case, updating observable state triggers rerendering. This way, for example, rxjs can be streamed directly to the template.

Once template parts are shipped natively in browser, the codebase is expected to be replaced.


### Scripts

There are two ways to attach scripts to the defined element.

_First_ is via `scoped` script attribute. That enables script to run with `this` defined as _element_ instance, instead of _window_. Also, it automatically exposes internal element references by id, making sure multiple instances ids don't clash.

```html
<template is="define-element">
  <my-element>
    <h1 id="header">{{ text }}</h1>
  </my-element>
  <script scoped>
    this // my-element
    header // h1
    this.params
    this.props
  <script>
</template>
```

The scoped script is run in `connectedCallback` with children and properties parsed and present on the element.

_Second_ method is via custom element constructor, as proposed by [declarative custom elements](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md). It provides more granular control over constructor, callbacks and attributes.
At the same time, it would require manual control over children, props and reactivity.

```html
<template is="define-element">
  <my-element></my-element>
  <script type="module">
    export default class MyCustomElement extends HTMLElement {
        constructor() {
            super()
        }
        connectedCallback() {}
        disconnectedCallback() {}
    }
  </script>
</template>
```

### Styles

Styles can be defined either globally or with `scoped` attribute, limiting CSS to only component instances.

```html
<template is="definition">
  <percentage-bar shadowmode="closed">
    <div id="progressbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{root.attributes.percentage.value}}">
        <div id="bar" style="width: {{root.attributes.percentage.value}}%"></div>
        <div id="label"><slot></slot></div>
    </div>
  </percentage-bar>
  <style scoped>
      :host { display: inline-block !important; }
      #progressbar { position: relative; display: block; width: 100%; height: 100%; }
      #bar { background-color: #36f; height: 100%; }
      #label { position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; text-align: center; }
  </style>
</template>
```


### Shadow DOM

Can be defined via `shadowroot` property.

```html
<template is="define-element" shadowroot="closed">
<template>
```

### Loops

To provide simple means of iteration over elements the `:each` directive can used as follows:

```html
<template is="define-element">
  <ul is=my-list>
    <li item:each="{{ items }}">{{ item.text }}</li>
  </ul>
  <script scoped>
    this.params.items = [1,2,3]
  </script>
</template>

<ul is=my-list>
```

It may take either iterable param or a number, in which case it will be used as counter:

```html
<span :each="10">.</span>
```

Note that item name is optional.

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

For optional attributes, `:if` can be used as suffix:

```html
<button disabled:if="{{ !active }}">Submit</button>
```

### Properties

Properties are defined as root element attributes with optional types and default value.

```html
<template is="define-element">
  <x-x count:number="0" b:boolean c:string d:date e></x-x>
  <script scoped>
    console.log(this.i) // 0
  </script>
</template>
```

Type case doesn't matter. Supported types:

* _String_
* _Date_
* _Boolean_
* _Number_
* _Array_
* _Object_

Default value is automatically converted to the indicated type.
If type is not defined, it's inferred automatically.

Properties can be read as

```js
element.props.count
```

Properties are reflected automatically as attributes.

There's special property `children` that is passed as instance children.










## ...

```html
<script src="...element-template.js"></script>
...
<template is="custom-element">
  <x-clock start:Date>
    <time datetime="{{ time }}">{{ time.toLocaleTimeString() }}</time>
  </x-clock>
  <script scoped>
    this.params.time = this.props.start || new Date();
    let id
    this.onconnected = () => id = setInterval(() => this.params.time = new Date(), 1000)
    this.ondisconnected = () => clearInterval(id)
  </script>
  <style scoped>
    :host {}
  </style>
</template>
...
<x-clock start="17:28"/>
```

<!--
```
<template is="custom-element">
  <x-stopwatch>
    <time datetime="{{  }}">{{ }}</time>
    <button :if="{{ active }}" id="start">Start</button>
    <button :else id="stop">Stop</button>
  </x-stopwatch>

  <style scoped>
  </style>

  <script scoped>
    this.params.active = false

    let id
    start.onclick = () => {
      this.params.active = true
    }
    stop.onclick = () => {
      this.params.active = false
    }
  </script>
</template>

<x-stopwatch />
```
-->


## Examples

### Hello World

```html
<template is="custom-element">
  <welcome-user>Hello, {{ name || 'guest' }}</welcome-user>
  <script scoped>
    this.params.name = await fetch('/user')).json()
  </script>
</template>

<welcome-user/>
```

### Timer

```html
<template is="custom-element">
  <x-timer start:Number><time id="timer">{{ count }}</time></x-timer>
  <script scoped>
    this.params.count = this.props.start || 0
    let id
    this.onmount = () => id = setInterval(() => this.params.count++, 1000)
    this.onunmount = () => clearInterval(id)
  </script>
</template>

<x-timer start="0"/>
```

### Counter

```html
<template is="custom-element">
  <x-counter count:Number="0">
    <output id="count">{{ count }}</output>
    <button id="inc">+</button><button id="dec">‐</button>
  </x-counter>
  <script scoped>
    // ids are kept local per-instance
    inc.onclick = e => this.props.count++
    dec.onclick = e => this.props.count--
  </script>
</template>

```

### Todo list

```html
<template is="custom-element">
<ul is="todo-list">
<form id="form">
  <input id="text" placeholder="Add Item..." required>
  <button type="submit">Add</button>
  <ul class="todo-list">
    <li class="todo-item" item:each="{{ items }}">{{ item.text }}</li>
  </ul>
  <script sandbox>
    this.params.todos = this.children.map(child => {text: child.textContent})
    form.onsubmit = e => {
      e.preventDefault()
      if (form.checkValidity()) {
        this.params.todos.push({ text: text.value })
        form.reset()
      }
    }
  </script>
</form>
</ul>
</template>

<ul is="todo-list">
  <li>A</li>
  <li>B</li>
</ul>
```

### Form validator

```html
<template is="custom-element">

<form is="validator-form">
      <label for=email>Please enter an email address:</label>
      <input id=email>
      <span :is={{ !valid }}>The address is invalid</span>
</form>

<script type="module">
  const isValidEmail = s => /.+@.+\..+/i.test(s);
  export default class ValidatorForm extends HTMLFormElement {
    constructor () {
      this.email.onchange= e => this.params.valid = isValidEmail(e.target.value)
    }
  }
</script>
</template>

<form is="validator-form" />
```



### License

ISC
