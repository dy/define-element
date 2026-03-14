import { tick } from 'wait-please'
import test, { is, ok } from 'tst'
import DefineElement, { define, types } from '../index.js'


// helper: create element, append to body, return it
const h = (html) => {
  let div = document.createElement('div')
  div.innerHTML = html
  document.body.appendChild(div)
  return div
}


test('basic: static template', async () => {
  let el = h(`
    <define-element>
      <x-basic1>
        <template><span>hello</span></template>
      </x-basic1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-basic1')
  document.body.appendChild(inst)
  is(inst.innerHTML, '<span>hello</span>')
  inst.remove()
  el.remove()
})


test('basic: no template preserves content', async () => {
  let el = h(`
    <define-element>
      <x-basic2></x-basic2>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-basic2')
  inst.innerHTML = '<b>kept</b>'
  document.body.appendChild(inst)
  is(inst.innerHTML, '<b>kept</b>')
  inst.remove()
  el.remove()
})


test('basic: multiple definitions', async () => {
  let el = h(`
    <define-element>
      <x-multi-a>
        <template><span>A</span></template>
      </x-multi-a>
      <x-multi-b>
        <template><span>B</span></template>
      </x-multi-b>
    </define-element>
  `)
  await tick()

  let a = document.createElement('x-multi-a')
  let b = document.createElement('x-multi-b')
  document.body.appendChild(a)
  document.body.appendChild(b)
  is(a.innerHTML, '<span>A</span>')
  is(b.innerHTML, '<span>B</span>')
  a.remove()
  b.remove()
  el.remove()
})


test('basic: define-element removes itself', async () => {
  let el = h(`
    <define-element>
      <x-removed1>
        <template><span>x</span></template>
      </x-removed1>
    </define-element>
  `)
  await tick()

  is(el.querySelector('define-element'), null)
  el.remove()
})


test('props: number type', async () => {
  let el = h(`
    <define-element>
      <x-prop-num count:number="42">
        <template></template>
      </x-prop-num>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-prop-num')
  document.body.appendChild(inst)
  is(inst.count, 42)
  is(typeof inst.count, 'number')

  inst.count = 99
  is(inst.getAttribute('count'), '99')
  inst.remove()
  el.remove()
})


test('props: boolean type', async () => {
  let el = h(`
    <define-element>
      <x-prop-bool disabled:boolean>
        <template></template>
      </x-prop-bool>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-prop-bool')
  document.body.appendChild(inst)
  is(inst.disabled, false)

  inst.disabled = true
  is(inst.hasAttribute('disabled'), true)

  inst.disabled = false
  is(inst.hasAttribute('disabled'), false)
  inst.remove()
  el.remove()
})


test('props: string type', async () => {
  let el = h(`
    <define-element>
      <x-prop-str label:string="hello">
        <template></template>
      </x-prop-str>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-prop-str')
  document.body.appendChild(inst)
  is(inst.label, 'hello')
  is(typeof inst.label, 'string')
  inst.remove()
  el.remove()
})


test('props: auto-detect type', async () => {
  let el = h(`
    <define-element>
      <x-prop-auto num="42" bool="true" str="hello">
        <template></template>
      </x-prop-auto>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-prop-auto')
  document.body.appendChild(inst)
  is(inst.num, 42)
  is(inst.bool, true)
  is(inst.str, 'hello')
  inst.remove()
  el.remove()
})


test('props: attribute reflection', async () => {
  let el = h(`
    <define-element>
      <x-prop-reflect val:number="0">
        <template></template>
      </x-prop-reflect>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-prop-reflect')
  document.body.appendChild(inst)

  // property → attribute
  inst.val = 5
  is(inst.getAttribute('val'), '5')

  // attribute → property
  inst.setAttribute('val', '10')
  is(inst.val, 10)
  inst.remove()
  el.remove()
})


test('props: instance attribute overrides default', async () => {
  let el = h(`
    <define-element>
      <x-prop-override name:string="default">
        <template></template>
      </x-prop-override>
    </define-element>
  `)
  await tick()

  let div = document.createElement('div')
  div.innerHTML = '<x-prop-override name="custom"></x-prop-override>'
  document.body.appendChild(div)
  let inst = div.querySelector('x-prop-override')
  is(inst.name, 'custom')
  div.remove()
  el.remove()
})


test('parts: this.part access', async () => {
  let el = h(`
    <define-element>
      <x-parts1>
        <template>
          <span part="label">text</span>
          <button part="btn">click</button>
        </template>
        <script>
          this.dataset.labelText = this.part.label.textContent
          this.dataset.btnText = this.part.btn.textContent
        </script>
      </x-parts1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-parts1')
  document.body.appendChild(inst)
  is(inst.dataset.labelText, 'text')
  is(inst.dataset.btnText, 'click')
  inst.remove()
  el.remove()
})


test('script: runs per-instance with this = element', async () => {
  let el = h(`
    <define-element>
      <x-script1>
        <template></template>
        <script>
          this.dataset.ran = 'true'
          this.dataset.tag = this.tagName.toLowerCase()
        </script>
      </x-script1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-script1')
  document.body.appendChild(inst)
  is(inst.dataset.ran, 'true')
  is(inst.dataset.tag, 'x-script1')
  inst.remove()
  el.remove()
})


test('script: access to props and state', async () => {
  let el = h(`
    <define-element>
      <x-script2 greeting:string="hi">
        <template></template>
        <script>
          this.dataset.greeting = this.greeting
          this.state.extra = 'local'
          this.dataset.extra = this.state.extra
        </script>
      </x-script2>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-script2')
  document.body.appendChild(inst)
  is(inst.dataset.greeting, 'hi')
  is(inst.dataset.extra, 'local')
  inst.remove()
  el.remove()
})


test('script: async with await', async () => {
  let el = h(`
    <define-element>
      <x-async1>
        <template></template>
        <script>
          let val = await Promise.resolve('done')
          this.dataset.result = val
        </script>
      </x-async1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-async1')
  document.body.appendChild(inst)
  await tick()
  is(inst.dataset.result, 'done')
  inst.remove()
  el.remove()
})


test('lifecycle: connected event', async () => {
  let el = h(`
    <define-element>
      <x-life1>
        <template></template>
        <script>
          this._count = 0
          this.onconnected = () => this._count++
        </script>
      </x-life1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-life1')
  document.body.appendChild(inst)
  is(inst._count, 1) // onconnected fires on first connect after script

  // re-insert
  inst.remove()
  document.body.appendChild(inst)
  is(inst._count, 2)
  inst.remove()
  el.remove()
})


test('lifecycle: disconnected event', async () => {
  let el = h(`
    <define-element>
      <x-life2>
        <template></template>
        <script>
          this._disconnected = false
          this.ondisconnected = () => this._disconnected = true
        </script>
      </x-life2>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-life2')
  document.body.appendChild(inst)
  is(inst._disconnected, false)

  inst.remove()
  is(inst._disconnected, true)
  el.remove()
})


test('lifecycle: attributechanged event', async () => {
  let el = h(`
    <define-element>
      <x-life3 val:number="0">
        <template></template>
        <script>
          this._changes = []
          this.onattributechanged = e => this._changes.push({ name: e.attributeName, val: e.newValue })
        </script>
      </x-life3>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-life3')
  document.body.appendChild(inst)
  inst.setAttribute('val', '5')
  is(inst._changes.length, 1)
  is(inst._changes[0].name, 'val')
  is(inst._changes[0].val, '5')
  inst.remove()
  el.remove()
})


test('lifecycle: adopted callback', async () => {
  let el = h(`
    <define-element>
      <x-adopted1>
        <template></template>
        <script>
          this._adopted = false
          this.onadopted = () => this._adopted = true
        </script>
      </x-adopted1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-adopted1')
  document.body.appendChild(inst)
  is(inst._adopted, false)

  // adoptedCallback fires when moved to new document
  let doc2 = document.implementation.createHTMLDocument()
  doc2.body.appendChild(inst)
  is(inst._adopted, true)
  inst.remove()
  el.remove()
})


test('lifecycle: reparenting preserves state', async () => {
  let el = h(`
    <define-element>
      <x-repar1 count:number="0">
        <template></template>
        <script>
          this.count = 5
        </script>
      </x-repar1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-repar1')
  document.body.appendChild(inst)
  is(inst.count, 5)

  // reparent — should preserve state
  let div = document.createElement('div')
  document.body.appendChild(div)
  div.appendChild(inst) // disconnect + reconnect
  is(inst.count, 5)
  is(inst.state.count, 5)

  div.remove()
  el.remove()
})


test('processor: pluggable template engine', async () => {
  let prevProcessor = DefineElement.processor
  DefineElement.processor = (root, state) => {
    root.querySelectorAll('[data-field]').forEach(el => {
      el.textContent = state[el.dataset.field] ?? ''
    })
    return state
  }

  let el = h(`
    <define-element>
      <x-proc1 msg:string="hello">
        <template><span data-field="msg"></span></template>
      </x-proc1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-proc1')
  inst.setAttribute('msg', 'world')
  document.body.appendChild(inst)
  is(inst.querySelector('span').textContent, 'world')

  DefineElement.processor = prevProcessor
  inst.remove()
  el.remove()
})


test('processor: receives correct state', async () => {
  let captured = null
  let prevProcessor = DefineElement.processor
  DefineElement.processor = (root, state) => { captured = { ...state }; return state }

  let el = h(`
    <define-element>
      <x-proc2 a:number="1" b:string="hi">
        <template></template>
      </x-proc2>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-proc2')
  inst.setAttribute('a', '5')
  document.body.appendChild(inst)
  is(captured.a, 5)
  is(captured.b, 'hi')

  DefineElement.processor = prevProcessor
  inst.remove()
  el.remove()
})


test('processor: receives original template element', async () => {
  let capturedTpl = null
  let prevProcessor = DefineElement.processor
  DefineElement.processor = (root, state) => { capturedTpl = root.template; return state }

  let el = h(`
    <define-element>
      <x-proc-tpl val:string="ok">
        <template><em>{{val}}</em></template>
      </x-proc-tpl>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-proc-tpl')
  document.body.appendChild(inst)
  ok(capturedTpl instanceof HTMLTemplateElement)
  ok(capturedTpl.content.querySelector('em'))

  DefineElement.processor = prevProcessor
  inst.remove()
  el.remove()
})


test('processor: per-definition overrides global', async () => {
  let globalCalled = false
  let perDefCalled = false
  let prevProcessor = DefineElement.processor
  DefineElement.processor = (root, state) => { globalCalled = true; return state }

  let el = document.createElement('x-perdef1')
  el.innerHTML = '<template><b>per-def</b></template>'
  el.setAttribute('v:string', 'ok')
  define(el, (root, state) => { perDefCalled = true; return state })

  let inst = document.createElement('x-perdef1')
  document.body.appendChild(inst)
  is(globalCalled, false)
  is(perDefCalled, true)
  is(inst.innerHTML, '<b>per-def</b>')

  DefineElement.processor = prevProcessor
  inst.remove()
})


test('shadow: shadowrootmode open', async () => {
  let el = h(`
    <define-element>
      <x-shadow1>
        <template shadowrootmode="open"><span>shadow</span></template>
      </x-shadow1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-shadow1')
  document.body.appendChild(inst)
  ok(inst.shadowRoot)
  is(inst.shadowRoot.querySelector('span').textContent, 'shadow')
  is(inst.innerHTML, '') // light DOM empty
  inst.remove()
  el.remove()
})


test('shadow: style in shadow DOM', async () => {
  let el = h(`
    <define-element>
      <x-shadow-style>
        <template shadowrootmode="open"><span>styled</span></template>
        <style>span { color: red; }</style>
      </x-shadow-style>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-shadow-style')
  document.body.appendChild(inst)
  // check: either adoptedStyleSheets or inline style
  let hasAdopted = inst.shadowRoot.adoptedStyleSheets?.length > 0
  let hasInline = !!inst.shadowRoot.querySelector('style')
  ok(hasAdopted || hasInline, 'style should be applied via adoptedStyleSheets or inline')
  inst.remove()
  el.remove()
})


test('shadow: parts in shadow DOM', async () => {
  let el = h(`
    <define-element>
      <x-shadow-parts>
        <template shadowrootmode="open">
          <span part="label">shadow-text</span>
          <button part="btn">shadow-btn</button>
        </template>
        <script>
          this.dataset.label = this.part.label.textContent
          this.dataset.btn = this.part.btn.textContent
        </script>
      </x-shadow-parts>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-shadow-parts')
  document.body.appendChild(inst)
  is(inst.dataset.label, 'shadow-text')
  is(inst.dataset.btn, 'shadow-btn')
  ok(inst.shadowRoot.querySelector('[part="label"]'))
  is(inst.querySelector('[part="label"]'), null)
  inst.remove()
  el.remove()
})


test('shadow: adopted stylesheets shared across instances', async () => {
  let el = h(`
    <define-element>
      <x-shadow-adopted>
        <template shadowrootmode="open"><b>a</b></template>
        <style>b { font-weight: normal; }</style>
      </x-shadow-adopted>
    </define-element>
  `)
  await tick()

  let inst1 = document.createElement('x-shadow-adopted')
  let inst2 = document.createElement('x-shadow-adopted')
  document.body.appendChild(inst1)
  document.body.appendChild(inst2)

  if (inst1.shadowRoot.adoptedStyleSheets?.length) {
    is(inst1.shadowRoot.adoptedStyleSheets[0], inst2.shadowRoot.adoptedStyleSheets[0])
  }

  inst1.remove()
  inst2.remove()
  el.remove()
})


test('style: scoped in light DOM via nesting', async () => {
  let el = h(`
    <define-element>
      <x-light-style>
        <template><span>styled</span></template>
        <style>span { color: blue; } :host { display: block; }</style>
      </x-light-style>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-light-style')
  document.body.appendChild(inst)

  let style = document.querySelector('style[data-de="x-light-style"]')
  ok(style)
  ok(style.textContent.includes('x-light-style'))
  ok(!style.textContent.includes(':host'))
  ok(style.textContent.startsWith('x-light-style {'))
  inst.remove()
  style.remove()
  el.remove()
})


test('style: dedup across instances', async () => {
  let el = h(`
    <define-element>
      <x-style-dedup>
        <template><span>a</span></template>
        <style>span { color: green; }</style>
      </x-style-dedup>
    </define-element>
  `)
  await tick()

  let inst1 = document.createElement('x-style-dedup')
  let inst2 = document.createElement('x-style-dedup')
  document.body.appendChild(inst1)
  document.body.appendChild(inst2)

  let styles = document.querySelectorAll('style[data-de="x-style-dedup"]')
  is(styles.length, 1)

  inst1.remove()
  inst2.remove()
  styles[0].remove()
  el.remove()
})


test('define: JS API', async () => {
  let C = define(Object.assign(document.createElement('x-jsapi2'), {
    innerHTML: '<template><b>js</b></template>'
  }))
  ok(C)

  let inst = document.createElement('x-jsapi2')
  document.body.appendChild(inst)
  is(inst.innerHTML, '<b>js</b>')
  inst.remove()
})


test('define: JS API with per-definition processor', async () => {
  let procState = null
  let el = document.createElement('x-jsapi-proc')
  el.innerHTML = '<template><em>hi</em></template>'
  el.setAttribute('x:number', '10')
  define(el, (root, state) => { procState = state; return state })

  let inst = document.createElement('x-jsapi-proc')
  document.body.appendChild(inst)
  is(inst.innerHTML, '<em>hi</em>')
  is(procState.x, 10)
  inst.remove()
})


test('props: date type', async () => {
  let el = h(`
    <define-element>
      <x-prop-date created:date>
        <template></template>
      </x-prop-date>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-prop-date')
  document.body.appendChild(inst)
  is(inst.created, null)

  inst.created = new Date('2025-01-01')
  ok(inst.getAttribute('created').includes('2025'))
  inst.remove()
  el.remove()
})


test('props: array type', async () => {
  let el = h(`
    <define-element>
      <x-prop-arr items:array="[1,2,3]">
        <template></template>
      </x-prop-arr>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-prop-arr')
  document.body.appendChild(inst)
  is(JSON.stringify(inst.items), '[1,2,3]')
  is(inst.items.length, 3)
  inst.remove()
  el.remove()
})


test('props: object type', async () => {
  let el = h(`
    <define-element>
      <x-prop-obj data:object='{"a":1}'>
        <template></template>
      </x-prop-obj>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-prop-obj')
  document.body.appendChild(inst)
  is(inst.data.a, 1)

  inst.data = { b: 2 }
  is(JSON.parse(inst.getAttribute('data')).b, 2)
  inst.remove()
  el.remove()
})


test('is: extending built-in element', async () => {
  let el = h(`
    <define-element>
      <ul is="x-sortable">
        <template></template>
        <script>
          this.dataset.tag = this.tagName.toLowerCase()
        </script>
      </ul>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('ul', { is: 'x-sortable' })
  document.body.appendChild(inst)
  ok(inst instanceof HTMLUListElement)
  is(inst.dataset.tag, 'ul')
  inst.remove()
  el.remove()
})


// --- Processor integration tests ---
// Each test simulates the core behavior of a real processor to verify the contract.

// Simulate sprae: reactive proxy that binds :text and :onclick directives
function spraelike(root, state) {
  let bindings = []
  root.querySelectorAll('[\\:text]').forEach(el => {
    let key = el.getAttribute(':text')
    bindings.push({ el, key, type: 'text' })
    el.textContent = state[key] ?? ''
  })
  root.querySelectorAll('[\\:onclick]').forEach(el => {
    let expr = el.getAttribute(':onclick')
    el.onclick = () => Function('state', `with(state){${expr}}`)(proxy)
  })
  let proxy = new Proxy(state, {
    set(t, k, v) {
      t[k] = v
      for (let b of bindings) if (b.key === k) b.el.textContent = v
      return true
    }
  })
  return proxy
}

test('processor[sprae]: initial render + reactivity + prop sync', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = spraelike

  let el = h(`
    <define-element>
      <x-sprae1 count:number="0">
        <template>
          <button :onclick="count++">
            Count: <span :text="count"></span>
          </button>
        </template>
      </x-sprae1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-sprae1')
  document.body.appendChild(inst)

  // initial render
  is(inst.querySelector('span').textContent, '0')

  // reactivity: state change → DOM update
  inst.state.count = 5
  is(inst.querySelector('span').textContent, '5')

  // prop → state → DOM
  inst.count = 10
  is(inst.querySelector('span').textContent, '10')
  is(inst.getAttribute('count'), '10')
  is(inst.state.count, 10)

  // attribute → prop → state → DOM
  inst.setAttribute('count', '20')
  is(inst.count, 20)
  is(inst.state.count, 20)
  is(inst.querySelector('span').textContent, '20')

  // onclick handler modifies reactive state
  inst.querySelector('button').click()
  is(inst.state.count, 21)
  is(inst.querySelector('span').textContent, '21')

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


test('processor[sprae]: multiple instances share definition, independent state', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = spraelike

  let el = h(`
    <define-element>
      <x-sprae2 val:number="0">
        <template><output :text="val"></output></template>
      </x-sprae2>
    </define-element>
  `)
  await tick()

  let a = document.createElement('x-sprae2')
  let b = document.createElement('x-sprae2')
  b.setAttribute('val', '99')
  document.body.appendChild(a)
  document.body.appendChild(b)

  is(a.querySelector('output').textContent, '0')
  is(b.querySelector('output').textContent, '99')

  a.state.val = 1
  is(a.querySelector('output').textContent, '1')
  is(b.querySelector('output').textContent, '99') // b unaffected

  DefineElement.processor = prev
  a.remove()
  b.remove()
  el.remove()
})


// Simulate @github/template-parts: TemplateInstance from tpl arg
// Replaces {{key}} placeholders in template content
function templatePartsLike(root, state) {
  // TemplateInstance clones root.template.content, replaces {{x}} with state values
  let clone = root.template.content.cloneNode(true)
  let walker = document.createTreeWalker(clone, 4) // text nodes
  let nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (let node of nodes) {
    if (!node.textContent.includes('{{')) continue
    node.textContent = node.textContent.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => state[k] ?? '')
  }
  // also handle attribute bindings: attr="{{key}}"
  clone.querySelectorAll('*').forEach(el => {
    for (let attr of [...el.attributes]) {
      if (!attr.value.includes('{{')) continue
      attr.value = attr.value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => state[k] ?? '')
    }
  })
  root.replaceChildren(clone)
  return state
}

test('processor[template-parts]: tpl arg, {{}} interpolation', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = templatePartsLike

  let el = h(`
    <define-element>
      <x-tparts1 name:string="world" greeting:string="Hello">
        <template><p>{{ greeting }}, {{ name }}!</p></template>
      </x-tparts1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-tparts1')
  document.body.appendChild(inst)
  is(inst.querySelector('p').textContent, 'Hello, world!')

  // instance attributes override defaults
  let inst2 = document.createElement('x-tparts1')
  inst2.setAttribute('name', 'Arjuna')
  inst2.setAttribute('greeting', 'Jai')
  document.body.appendChild(inst2)
  is(inst2.querySelector('p').textContent, 'Jai, Arjuna!')

  DefineElement.processor = prev
  inst.remove()
  inst2.remove()
  el.remove()
})


test('processor[template-parts]: tpl is reused across instances', async () => {
  let tpls = []
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    tpls.push(root.template)
    return templatePartsLike(root, state)
  }

  let el = h(`
    <define-element>
      <x-tparts2 x:number="0">
        <template><span>{{ x }}</span></template>
      </x-tparts2>
    </define-element>
  `)
  await tick()

  let a = document.createElement('x-tparts2')
  a.setAttribute('x', '1')
  let b = document.createElement('x-tparts2')
  b.setAttribute('x', '2')
  document.body.appendChild(a)
  document.body.appendChild(b)

  // same template element passed to both
  is(tpls.length, 2)
  is(tpls[0], tpls[1])

  // but rendered independently
  is(a.querySelector('span').textContent, '1')
  is(b.querySelector('span').textContent, '2')

  DefineElement.processor = prev
  a.remove()
  b.remove()
  el.remove()
})


test('processor[template-parts]: attribute bindings', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = templatePartsLike

  let el = h(`
    <define-element>
      <x-tparts3 url:string="/api" label:string="link">
        <template><a href="{{ url }}">{{ label }}</a></template>
      </x-tparts3>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-tparts3')
  document.body.appendChild(inst)
  let a = inst.querySelector('a')
  is(a.getAttribute('href'), '/api')
  is(a.textContent, 'link')

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


// Simulate petite-vue: createApp(state).mount(root), reactive(state)
// Processes v-text and {{ }} interpolation, returns reactive proxy
function petiteVueLike(root, state) {
  let bindings = []
  // v-text
  root.querySelectorAll('[v-text]').forEach(el => {
    let key = el.getAttribute('v-text')
    bindings.push({ el, key, type: 'text' })
    el.textContent = state[key] ?? ''
  })
  // {{ }} in text nodes
  let walker = document.createTreeWalker(root, 4)
  let textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)
  for (let node of textNodes) {
    if (!node.textContent.includes('{{')) continue
    let tplStr = node.textContent
    let matches = [...tplStr.matchAll(/\{\{\s*(\w+)\s*\}\}/g)]
    if (!matches.length) continue
    node.textContent = tplStr.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => state[k] ?? '')
    for (let m of matches) bindings.push({ node, tpl: tplStr, key: m[1], type: 'interpolation' })
  }
  let proxy = new Proxy(state, {
    set(t, k, v) {
      t[k] = v
      for (let b of bindings) {
        if (b.type === 'text' && b.key === k) b.el.textContent = v
        if (b.type === 'interpolation' && b.key === k) {
          b.node.textContent = b.tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k2) => t[k2] ?? '')
        }
      }
      return true
    }
  })
  return proxy
}

test('processor[petite-vue]: v-text + {{ }} + reactivity', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = petiteVueLike

  let el = h(`
    <define-element>
      <x-pvue1 name:string="world" count:number="0">
        <template>
          <h1 v-text="name"></h1>
          <p>Count: {{ count }}</p>
        </template>
      </x-pvue1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-pvue1')
  document.body.appendChild(inst)

  // initial render
  is(inst.querySelector('h1').textContent, 'world')
  is(inst.querySelector('p').textContent, 'Count: 0')

  // reactivity via state
  inst.state.name = 'Arjuna'
  is(inst.querySelector('h1').textContent, 'Arjuna')

  inst.state.count = 5
  is(inst.querySelector('p').textContent, 'Count: 5')

  // prop change → state → DOM
  inst.count = 42
  is(inst.querySelector('p').textContent, 'Count: 42')
  is(inst.getAttribute('count'), '42')

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


// Simulate Alpine.js: x-text, x-bind, x-show directives with reactive proxy
function alpineLike(root, state) {
  let bindings = []
  root.querySelectorAll('[x-text]').forEach(el => {
    let key = el.getAttribute('x-text')
    bindings.push({ el, key, type: 'text' })
    el.textContent = state[key] ?? ''
  })
  root.querySelectorAll('[x-show]').forEach(el => {
    let key = el.getAttribute('x-show')
    bindings.push({ el, key, type: 'show' })
    el.style.display = state[key] ? '' : 'none'
  })
  root.querySelectorAll('*').forEach(el => {
    let key = el.getAttribute('x-bind:class')
    if (!key) return
    bindings.push({ el, key, type: 'class' })
    if (state[key]) el.className = state[key]
  })
  let r = new Proxy(state, {
    set(t, k, v) {
      t[k] = v
      for (let b of bindings) {
        if (b.key !== k) continue
        if (b.type === 'text') b.el.textContent = v
        if (b.type === 'show') b.el.style.display = v ? '' : 'none'
        if (b.type === 'class') b.el.className = v || ''
      }
      return true
    }
  })
  return r
}

test('processor[alpine]: x-text, x-show, x-bind:class + reactivity', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = alpineLike

  let el = h(`
    <define-element>
      <x-alp1 msg:string="hello" visible:boolean cls:string="active">
        <template>
          <span x-text="msg"></span>
          <div x-show="visible">content</div>
          <b x-bind:class="cls"></b>
        </template>
      </x-alp1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-alp1')
  inst.setAttribute('visible', '')
  document.body.appendChild(inst)

  // initial
  is(inst.querySelector('span').textContent, 'hello')
  is(inst.querySelector('div').style.display, '')
  is(inst.querySelector('b').className, 'active')

  // reactivity
  inst.state.msg = 'bye'
  is(inst.querySelector('span').textContent, 'bye')

  inst.state.visible = false
  is(inst.querySelector('div').style.display, 'none')

  inst.state.cls = 'disabled'
  is(inst.querySelector('b').className, 'disabled')

  // prop change flows through
  inst.msg = 'updated'
  is(inst.querySelector('span').textContent, 'updated')
  is(inst.getAttribute('msg'), 'updated')

  // attribute change flows through
  inst.setAttribute('msg', 'attr-set')
  is(inst.state.msg, 'attr-set')
  is(inst.querySelector('span').textContent, 'attr-set')

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


test('processor[alpine]: hidden by default, show via attribute', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = alpineLike

  let el = h(`
    <define-element>
      <x-alp2 open:boolean>
        <template><div x-show="open">panel</div></template>
      </x-alp2>
    </define-element>
  `)
  await tick()

  // default: hidden
  let inst = document.createElement('x-alp2')
  document.body.appendChild(inst)
  is(inst.querySelector('div').style.display, 'none')

  // show via prop
  inst.open = true
  is(inst.querySelector('div').style.display, '')

  // hide via prop
  inst.open = false
  is(inst.querySelector('div').style.display, 'none')

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


// --- Processor contract tests ---

test('processor: no processor — static template', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = null

  let el = h(`
    <define-element>
      <x-static1 val:number="5">
        <template><b>static</b></template>
      </x-static1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-static1')
  document.body.appendChild(inst)
  is(inst.innerHTML, '<b>static</b>')
  is(inst.state.val, 5)
  is(inst.val, 5)

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


test('processor: state syncs props ↔ attributes ↔ state', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    return new Proxy(state, {
      set(t, k, v) { t[k] = v; return true }
    })
  }

  let el = h(`
    <define-element>
      <x-sync1 x:number="0">
        <template></template>
      </x-sync1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-sync1')
  document.body.appendChild(inst)

  inst.x = 10
  is(inst.getAttribute('x'), '10')
  is(inst.state.x, 10)

  inst.setAttribute('x', '20')
  is(inst.x, 20)
  is(inst.state.x, 20)

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


test('processor: dispose via ondisconnected', async () => {
  let disposed = false
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    state.dispose = () => { disposed = true }
    return state
  }

  let el = h(`
    <define-element>
      <x-dispose1>
        <template><span>disposable</span></template>
        <script>
          this.ondisconnected = () => this.state.dispose?.()
        </script>
      </x-dispose1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-dispose1')
  document.body.appendChild(inst)
  is(disposed, false)

  inst.remove()
  is(disposed, true)

  DefineElement.processor = prev
  el.remove()
})


// --- Real package integration tests ---

test('integration[@github/template-parts]: {{}} interpolation via tpl arg', async () => {
  let { TemplateInstance } = await import('@github/template-parts')
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    root.replaceChildren(new TemplateInstance(root.template, state))
    return state
  }

  let el = h(`
    <define-element>
      <x-real-tp1 name:string="world" greeting:string="Hello">
        <template><p>{{greeting}}, {{name}}!</p></template>
      </x-real-tp1>
    </define-element>
  `)
  await tick()

  // default props
  let inst = document.createElement('x-real-tp1')
  document.body.appendChild(inst)
  is(inst.querySelector('p').textContent, 'Hello, world!')

  // instance attribute override
  let inst2 = document.createElement('x-real-tp1')
  inst2.setAttribute('name', 'Arjuna')
  inst2.setAttribute('greeting', 'Jai')
  document.body.appendChild(inst2)
  is(inst2.querySelector('p').textContent, 'Jai, Arjuna!')

  DefineElement.processor = prev
  inst.remove()
  inst2.remove()
  el.remove()
})


test('integration[@github/template-parts]: tpl reused across instances', async () => {
  let { TemplateInstance } = await import('@github/template-parts')
  let tpls = []
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    tpls.push(root.template)
    root.replaceChildren(new TemplateInstance(root.template, state))
    return state
  }

  let el = h(`
    <define-element>
      <x-real-tp2 n:number="0">
        <template><span>{{n}}</span></template>
      </x-real-tp2>
    </define-element>
  `)
  await tick()

  let a = document.createElement('x-real-tp2')
  a.setAttribute('n', '1')
  let b = document.createElement('x-real-tp2')
  b.setAttribute('n', '2')
  document.body.appendChild(a)
  document.body.appendChild(b)

  is(tpls[0], tpls[1]) // same <template> element
  is(a.querySelector('span').textContent, '1')
  is(b.querySelector('span').textContent, '2')

  DefineElement.processor = prev
  a.remove()
  b.remove()
  el.remove()
})


test('integration[petite-vue]: v-text + reactivity', async () => {
  let { createApp, reactive, nextTick } = await import('petite-vue')
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    let r = reactive(state)
    createApp(r).mount(root)
    return r
  }

  let el = h(`
    <define-element>
      <x-real-pv1 msg:string="hello" count:number="0">
        <template>
          <span v-text="msg"></span>
          <output v-text="count"></output>
        </template>
      </x-real-pv1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-real-pv1')
  document.body.appendChild(inst)

  // initial render
  is(inst.querySelector('span').textContent, 'hello')
  is(inst.querySelector('output').textContent, '0')

  // reactivity: state → DOM
  inst.state.msg = 'world'
  await nextTick()
  is(inst.querySelector('span').textContent, 'world')

  // prop → state → DOM
  inst.count = 42
  await nextTick()
  is(inst.querySelector('output').textContent, '42')
  is(inst.getAttribute('count'), '42')

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


test('integration[petite-vue]: multiple instances independent', async () => {
  let { createApp, reactive } = await import('petite-vue')
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    let r = reactive(state)
    createApp(r).mount(root)
    return r
  }

  let el = h(`
    <define-element>
      <x-real-pv2 val:number="0">
        <template><output v-text="val"></output></template>
      </x-real-pv2>
    </define-element>
  `)
  await tick()

  let a = document.createElement('x-real-pv2')
  let b = document.createElement('x-real-pv2')
  b.setAttribute('val', '99')
  document.body.appendChild(a)
  document.body.appendChild(b)

  is(a.querySelector('output').textContent, '0')
  is(b.querySelector('output').textContent, '99')

  a.state.val = 1
  is(b.querySelector('output').textContent, '99') // b unaffected

  DefineElement.processor = prev
  a.remove()
  b.remove()
  el.remove()
})


test('integration[alpinejs]: x-text + reactivity', async () => {
  let { default: mod } = await import('alpinejs')
  let Alpine = mod.Alpine
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    let r = Alpine.reactive(state)
    Alpine.addScopeToNode(root, r)
    Alpine.initTree(root)
    return r
  }

  let el = h(`
    <define-element>
      <x-real-alp1 msg:string="hello" visible:boolean>
        <template>
          <span x-text="msg"></span>
          <div x-show="visible">content</div>
        </template>
      </x-real-alp1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-real-alp1')
  inst.setAttribute('visible', '')
  document.body.appendChild(inst)

  // initial render
  is(inst.querySelector('span').textContent, 'hello')

  // reactivity: state → DOM
  inst.state.msg = 'world'
  await tick()
  is(inst.querySelector('span').textContent, 'world')

  // prop → state → DOM
  inst.msg = 'updated'
  await tick()
  is(inst.querySelector('span').textContent, 'updated')
  is(inst.getAttribute('msg'), 'updated')

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


test('script: error does not break lifecycle', async () => {
  // suppress JSDOM's error reporting for this test
  let origError = console.error
  console.error = () => {}

  let el = h(`
    <define-element>
      <x-err1>
        <template><span>ok</span></template>
        <script>
          throw new Error('boom')
        </script>
      </x-err1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-err1')
  document.body.appendChild(inst)

  // template still cloned despite script error
  is(inst.innerHTML, '<span>ok</span>')

  // onconnected still fires on re-insert
  let connected = false
  inst.onconnected = () => connected = true
  inst.remove()
  document.body.appendChild(inst)
  is(connected, true)

  console.error = origError
  inst.remove()
  el.remove()
})


test('script: await in string does not make script async', async () => {
  let el = h(`
    <define-element>
      <x-noasync1>
        <template></template>
        <script>
          this.dataset.msg = "please await response"
        </script>
      </x-noasync1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-noasync1')
  document.body.appendChild(inst)
  is(inst.dataset.msg, 'please await response')
  inst.remove()
  el.remove()
})


test('define: duplicate registration is safe', async () => {
  let el = document.createElement('x-dup1')
  el.innerHTML = '<template><b>first</b></template>'
  define(el)

  // second call with same tag should not throw
  let el2 = document.createElement('x-dup1')
  el2.innerHTML = '<template><b>second</b></template>'
  let C = define(el2)
  ok(C)

  let inst = document.createElement('x-dup1')
  document.body.appendChild(inst)
  is(inst.innerHTML, '<b>first</b>')
  inst.remove()
})
