/**
 * <define-element> — a custom element to define custom elements.
 * Processor signature: (root, state) => void
 *
 * @example
 * <define-element>
 *   <x-counter count:number="0">
 *     <template><output id="out">0</output><button id="inc">+</button></template>
 *     <script>this.querySelector('#inc').onclick = () => this.count++</script>
 *   </x-counter>
 * </define-element>
 */

const types = {
  string: v => v == null ? '' : String(v),
  number: v => v == null ? 0 : Number(v),
  boolean: v => v != null && v !== 'false' && v !== false,
  date: v => v == null ? null : new Date(v),
  array: v => v == null ? [] : typeof v === 'string' ? JSON.parse(v) : v,
  object: v => v == null ? {} : typeof v === 'string' ? JSON.parse(v) : v,
}

const serialize = (v, type) =>
  v == null ? null :
  type === 'boolean' ? (v ? '' : null) :
  type === 'date' ? v.toISOString?.() ?? String(v) :
  String(v)

const auto = v => v == null ? v : !isNaN(v) && v !== '' ? Number(v) : v === 'true' ? true : v === 'false' ? false : v

let injectedStyles = new Set()
let _processor = null
let _noProc = new Set()

/** Parse prop declarations from element attributes: name:type="default" */
function parseProps(el) {
  let props = []
  for (let { name, value } of [...el.attributes]) {
    if (name === 'is') continue
    let [prop, type] = name.split(':')
    let coerce = type ? types[type] : auto
    props.push({ name: prop, type: type || null, default: coerce(value || null), coerce })
  }
  return props
}

/** Define a custom element from a definition element. */
function define(el) {
  let tag = el.localName
  let ext = el.getAttribute('is')

  let propDefs = parseProps(el)
  let propNames = propDefs.map(p => p.name)
  let propMap = Object.create(null)
  for (let p of propDefs) propMap[p.name] = p

  let tpl = el.querySelector('template')
  let shadowMode = tpl?.getAttribute('shadowrootmode') || null
  if (shadowMode) tpl.removeAttribute('shadowrootmode')

  let scriptText = el.querySelector('script')?.textContent || null
  let styleText = el.querySelector('style')?.textContent || null

  let adoptedSheet = null
  if (styleText && shadowMode && typeof CSSStyleSheet !== 'undefined') {
    adoptedSheet = new CSSStyleSheet()
    adoptedSheet.replaceSync(styleText)
  }

  let Base = ext ? document.createElement(tag).constructor : HTMLElement

  let C = class extends Base {
    static observedAttributes = propNames

    constructor() {
      super()
      this._de = false
      this.props = {}
      for (let p of propDefs) this.props[p.name] = p.default
    }

    connectedCallback() {
      if (!this._de) {
        this._de = true

        let root = this
        if (shadowMode) root = this.shadowRoot || this.attachShadow({ mode: shadowMode })
        this._de_root = root

        if (styleText) {
          if (shadowMode) {
            if (adoptedSheet) root.adoptedStyleSheets = [adoptedSheet]
            else { let s = document.createElement('style'); s.textContent = styleText; root.prepend(s) }
          } else if (!injectedStyles.has(tag)) {
            injectedStyles.add(tag)
            let s = document.createElement('style')
            s.textContent = scopeCSS(styleText, tag)
            s.setAttribute('data-de', tag)
            document.head.appendChild(s)
          }
        }

        if (tpl) root.template = tpl

        this._render()

        if (scriptText) runScript(scriptText, this)
      }

      this.onconnected?.()
    }

    _render() {
      let root = this._de_root

      if (tpl) root.replaceChildren()

      let state = { host: this }
      for (let p of propDefs) {
        let attrVal = this.getAttribute(p.name)
        state[p.name] = attrVal != null ? p.coerce(attrVal) : this.props[p.name]
      }

      if (_processor) {
        _noProc.delete(this)
        let saved = !shadowMode ? [...this.attributes].filter(a => !(a.name in propMap)).map(a => [a.name, a.value]) : []
        for (let [n] of saved) this.removeAttribute(n)
        _processor(root, state)
        for (let [n, v] of saved) this.setAttribute(n, v)
      } else {
        if (tpl && !root.firstChild) root.appendChild(tpl.content.cloneNode(true))
        _noProc.add(this)
      }
    }

    disconnectedCallback() {
      _noProc.delete(this)
      this.ondisconnected?.()
    }

    adoptedCallback() {
      this.onadopted?.()
    }

    attributeChangedCallback(name, _, newVal) {
      if (this._de_reflecting) return
      let def = propMap[name]
      if (!def) return
      let val = def.coerce(newVal)
      this.props[name] = val
      this.onpropchange?.(name, val)
    }
  }

  for (let p of propDefs) {
    Object.defineProperty(C.prototype, p.name, {
      get() { return this.props[p.name] },
      set(v) {
        let val = p.coerce(v)
        this.props[p.name] = val
        this.onpropchange?.(p.name, val)
        if (typeof val === 'function' || p.type === 'array' || p.type === 'object') return
        let s = serialize(val, p.type)
        this._de_reflecting = true
        if (s == null) this.removeAttribute(p.name)
        else this.setAttribute(p.name, s)
        this._de_reflecting = false
      },
      enumerable: true,
      configurable: true
    })
  }

  let name = ext || tag
  if (!customElements.get(name))
    customElements.define(name, C, ext ? { extends: tag } : undefined)

  return C
}


function runScript(text, thisArg) {
  let s = document.createElement('script')
  let stripped = text.replace(/\/\/.*|\/\*[\s\S]*?\*\/|(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '')
  let wrapper = /\bawait\b/.test(stripped)
    ? `(async function(){${text}}).call(document.currentScript._de_this)`
    : `(function(){${text}}).call(document.currentScript._de_this)`
  s._de_this = thisArg
  s.textContent = wrapper
  document.head.appendChild(s)
  s.remove()
}


function scopeCSS(css, tag) {
  css = css.replace(/:host\b(?:\(([^)]*)\))?/g, (_, sel) => sel ? `${tag}${sel}` : tag)
  return `${tag} { ${css} }`
}


class DefineElement extends HTMLElement {
  connectedCallback() {
    if (this.childElementCount) queueMicrotask(() => this._init())
    else setTimeout(() => this._init())
  }

  _init() {
    if (this._de_done) return
    this._de_done = true
    let defs = [...this.children].filter(c => {
      let ln = c.localName
      return ln !== 'template' && ln !== 'script' && ln !== 'style'
    })
    for (let def of defs) def.remove()
    this.remove()
    for (let def of defs) define(def)
  }
}

Object.defineProperty(DefineElement, 'processor', {
  get: () => _processor,
  set: (fn) => {
    _processor = fn
    for (let el of _noProc) if (el.isConnected) el._render()
    _noProc.clear()
  }
})

customElements.define('define-element', DefineElement)
