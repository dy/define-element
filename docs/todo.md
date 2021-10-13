## Plan

* [ ] test a.b.c props for attr/content
* [ ] test {a: boolean}
* [ ] test {a: function}
* [ ] test {a: number}
* [ ] test {a: string}
* [ ] test ternary {{ a ? b : c }}
* [ ] test function call {{ a(b) }}
* [ ] test method call {{ a.b.c(b) }}
* [ ] test fallback {{ a || b }}, {{ a ?? b }}
* [ ] test primitives `{{ 'foo' }}`, `{{ true }}`, `{{ 0.1 }}`
* [ ] test booleans `{{ foo && bar || baz }}`
* [ ] test comparisons `{{ foo === bar }}`
* [ ] test loop `{{ a, b, c in d }}`
* [ ] test math `{{ a * 2 + b / 3 }}`
* [ ] test `<table>{{rows}}</table>` https://github.com/domenic/template-parts/issues/2
* [ ] add better nodes replace algorithm
* [ ] workaround SVGs:
  ```
  const svgtpl = document.createElement('template')
  svgtpl.innerHTML = '<svg><path d="M {{x}} 0"></path></svg>'
  let tpl = new TemplateInstance(svgtpl, {x:0})
  ```
  ```
  const svgtpl = document.createElement('template')
  svgtpl.innerHTML = '<svg width="{{w}}"></svg>'
  let tpl = new TemplateInstance(svgtpl, {w:10})
  ```
