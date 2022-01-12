## Plan

* [ ] test a.b.c props for attr/content
* [ ] test {a: boolean}
* [ ] test {a: function}
* [ ] test {a: number}
* [ ] test {a: string}
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

