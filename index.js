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
  constructor() {
    super()
    // children are added immediately after the element, so we init as fast as content is ready via MO
    const mo = new MutationObserver(() => ( this.#init(), mo.disconnect() ))
    mo.observe(this.content, {childList: true})
    // FIXME: account for the case children are empty
  }

  #init() {
    const element = this.content.querySelector(':not(script):not(style)');

    // refs
    const ids = this.content.querySelectorAll('[id]')

    // props
    const propTypes = {}, defaults = {}
    ;[...element.attributes].forEach(({name, value}) => {
      let [prop, type] = name.split(':')
      propTypes[prop] = types[type]
      defaults[prop] = value
    })

    // template parts
    // FIXME: there should come something from first releases of spect/h
    // const nodes = element.querySelectorAll('*'), parts = []
    // nodes.forEach(node => {
    //   // node.attributes
    //   node.
    // })

    // script
    let init
    const script = this.content.querySelector('script');
    if (script.type === 'module') {
      // FIXME: top-level module exports (can be supported by native declarative custom-elements, some service-workers hack etc)
      // see https://2ality.com/2019/10/eval-via-import.html
    }
    else if (script.hasAttribute('scoped')) {
      init = new Function(`refs`, `with(refs){${script.innerHTML}}`)
    }

    // style
    const style = this.content.querySelector('style')

    // define custom element
    let ex = element.getAttribute('is'), Root = ex ? document.createElement(ex).constructor : HTMLElement

    customElements.define(element.localName, class extends Root {
      #refs = {}
      constructor() {
        super()

        // refs
        ids.forEach(({id}) => id in window ? null : Object.defineProperty(this.#refs, id, { get: () => this.querySelector('#' + id) }))

        // props
        // FIXME: should take in observables
        this.props = props(this, propTypes)
        this.addEventListener('prop', e => console.log('prop changed', this.props.count))

        // params
        // FIXME: should take in observables
        this.params = {}
      }
      connectedCallback() {
        // prerender defined children before actual adding to DOM
        this.append(...element.cloneNode(true).childNodes)

        init.call(this, this.#refs)

      }
    }, ex ? {extends: ex} : null)
  }
}

customElements.define('custom-element', ElementTemplate, { extends:'template' })

// FIXME: for better DX props can be limited to passed propTypes, that also simplifies attr interchange
function props (el, propTypes={}) {
  // auto-parse pkg in 2 lines (no object/array detection)
  // Number(n) is fast: https://jsperf.com/number-vs-plus-vs-toint-vs-tofloat/35
  const t = ( v, type ) => (
    type = type === Object || type === Array ? JSON.parse : type,
    v === '' && type !== String ? true : type ? type(v) : !v || isNaN(+v) ? v : +v
  ),

  proto = el.constructor.prototype,

  // inputs
  input = el.tagName === 'INPUT' || el.tagName === 'SELECT',
  iget = input && (el.type === 'checkbox' ? () => el.checked : () => el.value),
  iset = input && (el.type === 'text' ? value => el.value = (value == null ? '' : value) :
    el.type === 'checkbox' ? value => (el.value = (value ? 'on' : ''), p.checked = value) :
    el.type === 'select-one' ? value => (
      [...el.options].map(el => el.removeAttribute('selected')),
      el.value = value,
      el.selectedOptions[0] && el.selectedOptions[0].setAttribute('selected', '')
    ) :
    value => el.value = value
  ),
  p = new Proxy(
    el.attributes,
    {
      get: (a, k) =>
        input && k === 'value' ? iget() :
        // k === 'children' ? [...el.childNodes] :
        k in el ? el[k] : a[k] && (a[k].call ? a[k] : t(a[k].value, propTypes[k])),
      set: (a, k, v, desc) => (
        // input case
        input && k === 'value' ? iset(v) :
        (
          v = t(v, propTypes[k]),
          el[k] !== v &&
          // avoid readonly props https://jsperf.com/element-own-props-set/1
          (!(k in proto) || !(desc = Object.getOwnPropertyDescriptor(proto, k)) || desc.set) && (el[k] = v),
          v === false || v == null ? el.removeAttribute(k) :
          typeof v !== 'function' && el.setAttribute(k,
            v === true ? '' :
            typeof v === 'number' || typeof v === 'string' ? v :
            k === 'class' && Array.isArray(v) ? v.filter(Boolean).join(' ') :
            k === 'style' && v.constructor === Object ?
              (k=v,v=Object.values(v),Object.keys(k).map((k,i) => `${k}: ${v[i]};`).join(' ')) :
            ''
          )
        ),
        el.dispatchEvent(new CustomEvent('prop'))
      ),

      deleteProperty:(a,k) => (el.removeAttribute(k),delete el[k]),

      // spread https://github.com/tc39/proposal-object-rest-spread/issues/69#issuecomment-633232470
      getOwnPropertyDescriptor: _ => ({ enumerable: true, configurable: true }),

      // joined props from element keys and real attributes
      ownKeys: a => Array.from(
        new Set([...Object.keys(el), ...Object.getOwnPropertyNames(a)].filter(k => el[k] !== p && isNaN(+k)))
      )
    }
  )

  if (input) iset(iget())

  return p
}
