import props from 'element-props'
import {TemplateInstance} from '@github/template-parts'
import processor from './processor.js'

const types = {
  'number': Number,
  'boolean': Boolean,
  'string': String,
  'date': Date,
  'list': Array,
  'json': JSON.parse,
  'set': Set
}

class ElementTemplate extends HTMLTemplateElement {
  connectedCallback(){
    // children are added immediately after the element, so we init as fast as content is ready via MO
    const mo = new MutationObserver(() => ( this.#init(), mo.disconnect() ))
    mo.observe(this.content, {childList: true})
    // to make sure mo triggers, if no children
    this.appendChild(document.createTextNode(''))
  }

  #init() {
    const template = this

    // script
    let init, script = template.content.querySelector('script');
    if (script) {
      script.remove()
      if (script.type === 'module') {
        // FIXME: top-level module exports (can be supported by native declarative custom-elements, some service-workers hack etc)
        // see https://2ality.com/2019/10/eval-via-import.html
      }
      else if (script.hasAttribute('scoped')) {
        init = new Function(`refs`, `with(refs){${script.innerHTML}}`)
      }
    }

    // style
    const style = template.content.querySelector('style')
    if (style) style.remove()

    // refs
    const ids = template.content.querySelectorAll('[id]')

    // element
    const element = template.content.firstElementChild;
    template.content.removeChild(element)
    template.content.append(...element.childNodes)

    // props
    const propTypes = {}, defaults = {}
    ;[...element.attributes].forEach(({name, value}) => {
      let [prop, type] = name.split(':')
      propTypes[prop] = types[type]
      defaults[prop] = value
    })

    // define custom element
    let ex = element.getAttribute('is'), Root = ex ? document.createElement(ex).constructor : HTMLElement
    const childrenFrag = document.createDocumentFragment()

    customElements.define(element.localName, class extends Root {
      #refs = {}
      connectedCallback() {
        // refs
        ids.forEach(({id}) => id in window ? null : Object.defineProperty(this.#refs, id, { get: () => this.querySelector('#' + id) }))

        // props
        // FIXME: should take in observables
        // FIXME: for better DX props can be limited to passed propTypes, that also simplifies attr interchange
        this.props = props(this, propTypes)
        this.addEventListener('prop', e => console.log('prop changed', this.props.count))

        // params
        // FIXME: should take in observables
        this.params = {}

        // children are added immediately after the element, so we init as fast as content is ready via MO
        const mo = new MutationObserver(rx => {
          // mo.disconnect()
          this.params.children = [...this.childNodes]
          this.innerHTML = ''
          console.log(rx[0].addedNodes[0].data)
          // const tpl = new TemplateInstance(template, this.params, processor)
          // this.append(tpl)
          // console.log(this.firstChild.data, this.lastChild.data)
          // init.call(this, this.#refs)
        })
        mo.observe(this, {childList: true})

        this.append(document.createTextNode(''))
      }
    }, ex ? {extends: ex} : null)
  }
}

customElements.define('custom-element', ElementTemplate, { extends:'template' })
