/**
 * <define-element> — a custom element to define custom elements.
 * Processor signature: (root, state) => state
 *
 * State includes declared props + `host` (the CE element reference).
 * Reserved state keys: `host`. Do not declare a prop named `host`.
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
 */
function define(el) {
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
          root = this.shadowRoot || this.attachShadow({ mode: shadowMode })
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

        // expose original template for processors
        if (tpl) root.template = tpl

        // clear stale children from cloneNode(true) — processor/template will repopulate
        if (tpl) root.replaceChildren()

        // build initial state from prop defaults + current attributes
        let state = { host: this }
        for (let p of propDefs) {
          let coerce = p.type ? types[p.type] : auto
          let attrVal = this.getAttribute(p.name)
          state[p.name] = attrVal != null ? coerce(attrVal) : this._de_props[p.name]
        }

        // run processor or clone template
        let p = DefineElement.processor
        if (p) {
          // light DOM: temporarily remove non-prop attrs (parent directives like :each, :x)
          // so the processor doesn't process them — they belong to the parent scope
          let saved = !shadowMode ? [...this.attributes].filter(a => !(a.name in propMap)).map(a => [a.name, a.value]) : []
          for (let [n] of saved) this.removeAttribute(n)

          let result = p(root, state)
          this.state = result || state

          // restore parent attrs
          for (let [n, v] of saved) this.setAttribute(n, v)
        } else {
          if (tpl && !root.firstChild) {
            root.appendChild(tpl.content.cloneNode(true))
          }
          this.state = state
        }

        // collect parts (after processor, since it populates root)
        this.part = {}
        root.querySelectorAll('[part]').forEach(p =>
          this.part[p.getAttribute('part')] = p
        )

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
      if (this._de_reflecting) return
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
        // skip reflection for functions — can't round-trip through attributes
        if (typeof val === 'function') return
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


/** CSS scoping for light DOM via CSS nesting. :host → tag. */
function scopeCSS(css, tag) {
  css = css.replace(/:host\b(?:\(([^)]*)\))?/g, (_, sel) => sel ? `${tag}${sel}` : tag)
  return `${tag} { ${css} }`
}


/**
 * <define-element> — scans children for component definitions.
 */
class DefineElement extends HTMLElement {
  connectedCallback() {
    // children present → upgrade/programmatic/module (parsing done) → microtask
    // children absent → sync script mid-parse (children not yet parsed) → macro-task
    if (this.childElementCount) queueMicrotask(() => this._init())
    else setTimeout(() => this._init())
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

DefineElement.processor = null

customElements.define('define-element', DefineElement)

