// Bug: :if double toggle inside CE throws "t[O] is not a function"
// Needs start() (MutationObserver mode) + complex nested template
import { tick } from 'wait-please'
import test, { is, ok } from 'tst'
import sprae, { start } from 'sprae'
import '../define-element.js'

const DefineElement = customElements.get('define-element')

test('bug: CE with :if + start() — double toggle should not throw', async () => {
  let prevProcessor = DefineElement.processor
  let errors = []
  let origError = console.error
  console.error = (...args) => { errors.push(args.join(' ')); origError(...args) }

  DefineElement.processor = (root, state) => {
    if (root.template) root.appendChild(root.template.content.cloneNode(true))
    let own = {}
    for (let k of Object.getOwnPropertyNames(state.host))
      if (k !== 'props' && !k.startsWith('_de')) own[k] = state.host[k]
    let sp = sprae(root, {
      emit: (name, detail) => setTimeout(() => state.host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }))),
      ...own, ...state
    })
    for (let k in own) if (typeof own[k] === 'function') sp[k] = own[k].bind(sp)
    let _ceHandler = state.host.onpropchange
    state.host.onpropchange = (k, v) => { sp[k] = v; if (_ceHandler) _ceHandler.call(sp, k, v) }
    return sp
  }

  let page = document.createElement('div')
  page.innerHTML = `
    <define-element>
      <x-form2 show:boolean="false">
        <style>:host { display: contents; }</style>
        <template>
          <div :if="show" class="modal-overlay">
            <div class="modal">
              <h2 :text="'Edit'"></h2>
              <div class="items">
                <div :each="item in [{a:1},{a:2}]" :text="item.a"></div>
              </div>
              <select :value="'a'"><option value="a">A</option><option value="b">B</option></select>
              <button :onclick="emit('cancel')">Cancel</button>
            </div>
          </div>
        </template>
        <script>
          this.onpropchange = function(k, v) {
            if (k === 'show' && v) { /* init */ }
          }
        </script>
      </x-form2>
    </define-element>
    <x-form2 :show="visible"></x-form2>
  `
  document.body.appendChild(page)
  await tick()

  // Use start() like the real app
  let s = start(page, { visible: false })
  await tick()

  // Cycle 1
  s.visible = true
  await tick()
  is(page.querySelector('.modal') != null, true, 'cycle 1: show')
  s.visible = false
  await tick()
  is(page.querySelector('.modal'), null, 'cycle 1: hide')

  // Cycle 2
  s.visible = true
  await tick()
  is(page.querySelector('.modal') != null, true, 'cycle 2: show')
  s.visible = false
  await tick()
  is(page.querySelector('.modal'), null, 'cycle 2: hide')

  // Cycle 3
  s.visible = true
  await tick()
  is(page.querySelector('.modal') != null, true, 'cycle 3: show')
  s.visible = false
  await tick()
  is(page.querySelector('.modal'), null, 'cycle 3: hide')

  let relevant = errors.filter(e => e.includes('not a function') || e.includes('TypeError'))
  is(relevant.length, 0, 'no TypeError errors: ' + (relevant[0] || ''))

  page.remove()
  console.error = origError
  DefineElement.processor = prevProcessor
})
