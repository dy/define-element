// Regression test: sprae start() + define-element processor
//
// The mandala app uses sprae.start() (MutationObserver-based) not sprae().
// When the processor calls sprae() on CE content during start()'s processing,
// sprae 13.2.1 breaks: :text produces empty content, :if leaks hidden elements.

import { tick } from 'wait-please'
import test, { is, ok } from 'tst'
import sprae, { start } from 'sprae'
import '../define-element.js'

const DefineElement = customElements.get('define-element')

test('regression: start() + sprae processor + :text renders correctly', async () => {
  let prevProcessor = DefineElement.processor

  // Processor pattern from mandala: calls sprae() on CE content
  DefineElement.processor = (root, state) => {
    if (root.template) root.appendChild(root.template.content.cloneNode(true))
    let own = {}
    for (let k of Object.getOwnPropertyNames(state.host))
      if (k !== 'props' && !k.startsWith('_de')) own[k] = state.host[k]
    let sp = sprae(root, { ...own, ...state })
    for (let k in own) if (typeof own[k] === 'function') sp[k] = own[k].bind(sp)
    let _ceHandler = state.host.onpropchange
    state.host.onpropchange = (k, v) => { sp[k] = v; if (_ceHandler) _ceHandler.call(sp, k, v) }
    return sp
  }

  let page = document.createElement('div')
  page.innerHTML = `
    <h3 :text="title">placeholder</h3>
    <define-element>
      <x-form show:boolean="false">
        <style>:host { display: contents; }</style>
        <template>
          <div :if="show" class="modal">
            <select>
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
            </select>
          </div>
        </template>
      </x-form>
    </define-element>
    <x-form :show="visible"></x-form>
    <p :text="desc">placeholder</p>
  `
  document.body.appendChild(page)
  await tick()

  // Use start() like mandala's init() does
  let s = start(page, { title: 'Finance', desc: 'Summary', visible: false })
  await tick()

  // :text should work
  is(page.querySelector('h3').textContent, 'Finance', ':text should render on h3')
  is(page.querySelector('p').textContent, 'Summary', ':text should render on p')

  // :if="false" should hide CE content
  is(page.querySelector('.modal'), null, 'modal hidden when show=false')
  is(page.querySelectorAll('option').length, 0, 'options should not leak')

  // Toggle
  s.visible = true
  await tick()

  is(page.querySelector('.modal') != null, true, 'modal visible when show=true')
  is(page.querySelectorAll('option').length, 3, 'options render')
  is(page.querySelector('h3').textContent, 'Finance', ':text still works')

  page.remove()
  DefineElement.processor = prevProcessor
})

test('regression: start() + CE with script block + :each inside :if', async () => {
  let prevProcessor = DefineElement.processor

  DefineElement.processor = (root, state) => {
    if (root.template) root.appendChild(root.template.content.cloneNode(true))
    let own = {}
    for (let k of Object.getOwnPropertyNames(state.host))
      if (k !== 'props' && !k.startsWith('_de')) own[k] = state.host[k]
    let sp = sprae(root, { ...own, ...state })
    for (let k in own) if (typeof own[k] === 'function') sp[k] = own[k].bind(sp)
    state.host.onpropchange = (k, v) => sp[k] = v
    return sp
  }

  let page = document.createElement('div')
  page.innerHTML = `
    <define-element>
      <y-list items:array show:boolean="false">
        <style>:host { display: contents; }</style>
        <template>
          <ul :if="show"><li :each="item in items" :text="item"></li></ul>
        </template>
        <script>
          this.onpropchange = function(k, v) {
            if (k === 'show' && v) { /* lifecycle hook */ }
          }
        </script>
      </y-list>
    </define-element>
    <h3 :text="heading">placeholder</h3>
    <y-list :show="visible" :items="data"></y-list>
    <p :text="footer">placeholder</p>
  `
  document.body.appendChild(page)
  await tick()

  let s = start(page, { heading: 'Title', footer: 'End', visible: false, data: ['a', 'b', 'c'] })
  await tick()

  is(page.querySelector('h3').textContent, 'Title', 'heading renders')
  is(page.querySelector('p').textContent, 'End', 'footer renders')
  is(page.querySelectorAll('li').length, 0, 'list hidden')

  s.visible = true
  await tick()

  is(page.querySelectorAll('li').length, 3, '3 items after show')
  is(page.querySelector('h3').textContent, 'Title', 'heading still there')

  page.remove()
  DefineElement.processor = prevProcessor
})
