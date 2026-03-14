/**
 * <define-element> — a custom element to define custom elements.
 * Processor signature: (root, state, tpl) => state
 *
 * @example
 * <define-element>
 *   <x-counter count:number="0">
 *     <template><output part="out">0</output><button part="inc">+</button></template>
 *     <script>this.part.inc.onclick = () => this.count++</script>
 *   </x-counter>
 * </define-element>
 */

// Type coercions for prop values
const types = {
  string: v => v == null ? '' : String(v),
  number: v => v == null ? 0 : Number(v),
  boolean: v => v != null && v !== 'false' && v !== false,
  date: v => v == null ? null : new Date(v),
  array: v => v == null ? [] : typeof v === 'string' ? JSON.parse(v) : Array.from(v),
  object: v => v == null ? {} : typeof v === 'string' ? JSON.parse(v) : v,
}

// Serialize value to attribute string
const serialize = (v, type) =>
  v == null ? null :
  type === 'boolean' ? (v ? '' : null) :
  type === 'array' || type === 'object' ? JSON.stringify(v) :
  type === 'date' ? v.toISOString?.() ?? String(v) :
  String(v)

// Auto-detect type from string value
const auto = v => v == null ? v : !isNaN(v) && v !== '' ? Number(v) : v === 'true' ? true : v === 'false' ? false : v

// Default global processor
let processor = null

// Track which light-DOM styles have been injected
let injectedStyles = new Set()

/**
 * Parse prop declarations from element attributes.
 * Format: name:type="default" or name="default" (auto-detect type)
 */
function parseProps(el) {
  let props = []
  for (let { name, value } of [...el.attributes]) {
    if (name === 'is') continue
    let [prop, type] = name.split(':')
    props.push({ name: prop, type: type || null, default: value })
  }
  return props
}

/**
 * Define a custom element from a definition element.
 * @param {Element} el - The definition child (e.g., <x-counter count:number="0">)
 * @param {Function} [proc] - Optional per-definition processor, overrides global
 * @returns {Function} The registered custom element class
 */
function define(el, proc) {
  let tag = el.localName
  let ext = el.getAttribute('is')

  let propDefs = parseProps(el)
  let propNames = propDefs.map(p => p.name)
  let propMap = Object.fromEntries(propDefs.map(p => [p.name, p]))

  // extract sections
  let tpl = el.querySelector('template')
  let shadowMode = tpl?.getAttribute('shadowrootmode') || null
  if (shadowMode) tpl.removeAttribute('shadowrootmode')

  let scriptEl = el.querySelector('script')
  let scriptText = scriptEl?.textContent || null

  let styleEl = el.querySelector('style')
  let styleText = styleEl?.textContent || null

  // shared adopted stylesheet for shadow DOM (one per definition)
  let adoptedSheet = null
  if (styleText && shadowMode && typeof CSSStyleSheet !== 'undefined') {
    adoptedSheet = new CSSStyleSheet()
    adoptedSheet.replaceSync(styleText)
  }

  // resolve processor: per-definition > global
  let proc_ = proc || null

  // determine base class
  let Base = ext ? document.createElement(tag).constructor : HTMLElement

  let C = class extends Base {
    static observedAttributes = propNames

    constructor() {
      super()
      this._de_init = false
      this._de_props = {}

      for (let p of propDefs) {
        let coerce = p.type ? types[p.type] : auto
        this._de_props[p.name] = coerce(p.default || null)
      }
    }

    connectedCallback() {
      if (!this._de_init) {
        this._de_init = true

        let root = this
        if (shadowMode) {
          this.attachShadow({ mode: shadowMode })
          root = this.shadowRoot
        }

        if (tpl) {
          root.appendChild(tpl.content.cloneNode(true))
        }

        // inject style
        if (styleText) {
          if (shadowMode) {
            if (adoptedSheet) {
              root.adoptedStyleSheets = [adoptedSheet]
            } else {
              let s = document.createElement('style')
              s.textContent = styleText
              root.prepend(s)
            }
          } else {
            // light DOM: @scope
            let s = document.createElement('style')
            s.textContent = scopeCSS(styleText, tag)
            s.setAttribute('data-de', tag)
            if (!injectedStyles.has(tag)) {
              injectedStyles.add(tag)
              document.head.appendChild(s)
            }
          }
        }

        // collect parts
        this.part = {}
        root.querySelectorAll('[part]').forEach(p =>
          this.part[p.getAttribute('part')] = p
        )

        // build initial state from prop defaults + current attributes
        let state = {}
        for (let p of propDefs) {
          let coerce = p.type ? types[p.type] : auto
          let attrVal = this.getAttribute(p.name)
          state[p.name] = attrVal != null ? coerce(attrVal) : this._de_props[p.name]
        }

        // run processor (per-definition > global)
        let p = proc_ || processor
        if (p) {
          let result = p(root, state, tpl)
          this.state = result || state
        } else {
          this.state = state
        }

        // run script (errors in injected scripts don't throw — browser reports via onerror)
        if (scriptText) runScript(scriptText, this)
      }

      this.onconnected?.()
    }

    disconnectedCallback() {
      this.ondisconnected?.()
    }

    adoptedCallback() {
      this.onadopted?.()
    }

    attributeChangedCallback(name, oldVal, newVal) {
      let def = propMap[name]
      if (!def) return

      let coerce = def.type ? types[def.type] : auto
      let val = coerce(newVal)
      this._de_props[name] = val

      if (this._de_init && this.state) {
        this.state[name] = val
      }

      this.onattributechanged?.({ attributeName: name, oldValue: oldVal, newValue: newVal })
    }
  }

  // define props as getter/setter on prototype
  for (let p of propDefs) {
    let coerce = p.type ? types[p.type] : auto
    Object.defineProperty(C.prototype, p.name, {
      get() { return this._de_props[p.name] },
      set(v) {
        let val = coerce(v)
        this._de_props[p.name] = val
        if (this._de_init && this.state) this.state[p.name] = val
        let s = serialize(val, p.type)
        if (s == null) this.removeAttribute(p.name)
        else this.setAttribute(p.name, s)
      },
      enumerable: true,
      configurable: true
    })
  }

  // register (skip if already defined)
  let name = ext || tag
  if (!customElements.get(name))
    customElements.define(name, C, ext ? { extends: tag } : undefined)

  return C
}


/**
 * Execute script text via <script> element injection (no eval/new Function).
 * Wraps in IIFE with `this` bound to element instance.
 */
function runScript(text, thisArg) {
  let s = document.createElement('script')
  let stripped = text.replace(/\/\/.*|\/\*[\s\S]*?\*\/|(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '')
  let isAsync = /\bawait\b/.test(stripped)
  let wrapper = isAsync
    ? `(async function(){${text}}).call(document.currentScript._de_this)`
    : `(function(){${text}}).call(document.currentScript._de_this)`
  s._de_this = thisArg
  s.textContent = wrapper
  document.head.appendChild(s)
  s.remove()
}


/**
 * CSS scoping for light DOM via @scope.
 * :host → :scope, then wraps in @scope (tag) { ... }
 */
function scopeCSS(css, tag) {
  css = css.replace(/:host\b(?:\(([^)]*)\))?/g, (_, sel) => sel ? `:scope${sel}` : ':scope')
  return `@scope (${tag}) { ${css} }`
}


/**
 * <define-element> — scans children for component definitions.
 */
class DefineElement extends HTMLElement {
  connectedCallback() {
    queueMicrotask(() => this._init())
  }

  _init() {
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
  get: () => processor,
  set: v => processor = v
})

customElements.define('define-element', DefineElement)

export default DefineElement
export { DefineElement, define, types }
