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


test('style: scoped in light DOM uses @scope', async () => {
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
  ok(style.textContent.includes('@scope'))
  ok(style.textContent.includes('x-light-style'))
  ok(!style.textContent.includes(':host'))
  ok(style.textContent.includes(':scope'))
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
          this.dataset.base = (this instanceof HTMLUListElement).toString()
        </script>
      </ul>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('ul', { is: 'x-sortable' })
  document.body.appendChild(inst)
  ok(inst instanceof HTMLUListElement)
  is(inst.dataset.base, 'true')
  inst.remove()
  el.remove()
})


// --- Processor contract tests ---

test('processor: mustache-style text interpolation', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    let walker = document.createTreeWalker(root, 4)
    let nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (let node of nodes) {
      if (!node.textContent.includes('{{')) continue
      let tpl = node.textContent
      node.textContent = tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => state[k] ?? '')
    }
    return state
  }

  let el = h(`
    <define-element>
      <x-mustache1 name:string="world">
        <template><span>hello {{ name }}</span></template>
      </x-mustache1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-mustache1')
  document.body.appendChild(inst)
  is(inst.querySelector('span').textContent, 'hello world')

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


test('processor: reactive proxy (sprae-like)', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    let bindings = root.querySelectorAll('[data-bind]')
    let proxy = new Proxy(state, {
      set(t, k, v) {
        t[k] = v
        bindings.forEach(el => {
          if (el.dataset.bind === k) el.textContent = v
        })
        return true
      }
    })
    bindings.forEach(el => {
      el.textContent = state[el.dataset.bind] ?? ''
    })
    return proxy
  }

  let el = h(`
    <define-element>
      <x-reactive1 count:number="0">
        <template><output data-bind="count"></output></template>
      </x-reactive1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-reactive1')
  document.body.appendChild(inst)
  is(inst.querySelector('output').textContent, '0')

  inst.state.count = 42
  is(inst.querySelector('output').textContent, '42')

  inst.count = 7
  is(inst.querySelector('output').textContent, '7')

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


test('processor: dispose via ondisconnected', async () => {
  let disposed = false
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    state[Symbol.dispose] = () => { disposed = true }
    return state
  }

  let el = h(`
    <define-element>
      <x-dispose1>
        <template><span>disposable</span></template>
        <script>
          this.ondisconnected = () => this.state[Symbol.dispose]?.()
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


test('processor: vdom-style render function (preact-like)', async () => {
  let renderCount = 0
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    const render = () => {
      renderCount++
      root.innerHTML = `<div>${state.text || ''}</div>`
    }
    render()
    return state
  }

  let el = h(`
    <define-element>
      <x-vdom1 text:string="hi">
        <template></template>
      </x-vdom1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-vdom1')
  document.body.appendChild(inst)
  is(inst.querySelector('div').textContent, 'hi')
  is(renderCount, 1)

  DefineElement.processor = prev
  inst.remove()
  el.remove()
})


test('processor: attribute-directive style (alpine-like)', async () => {
  let prev = DefineElement.processor
  DefineElement.processor = (root, state) => {
    root.querySelectorAll('[x-text]').forEach(el => {
      let key = el.getAttribute('x-text')
      el.textContent = state[key] ?? ''
    })
    root.querySelectorAll('[x-show]').forEach(el => {
      let key = el.getAttribute('x-show')
      el.style.display = state[key] ? '' : 'none'
    })
    return state
  }

  let el = h(`
    <define-element>
      <x-alpine1 msg:string="hey" visible:boolean>
        <template>
          <span x-text="msg"></span>
          <div x-show="visible">shown</div>
        </template>
      </x-alpine1>
    </define-element>
  `)
  await tick()

  let inst = document.createElement('x-alpine1')
  inst.setAttribute('visible', '')
  document.body.appendChild(inst)
  is(inst.querySelector('span').textContent, 'hey')
  is(inst.querySelector('div').style.display, '')

  let inst2 = document.createElement('x-alpine1')
  document.body.appendChild(inst2)
  is(inst2.querySelector('div').style.display, 'none')

  DefineElement.processor = prev
  inst.remove()
  inst2.remove()
  el.remove()
})


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
