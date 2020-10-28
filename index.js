class ElementTemplate extends HTMLTemplateElement {
  constructor() {
    super()

    // children are added immediately after the element, so we init as fast as content is ready via MO
    const mo = new MutationObserver(() => {
      // FIXME: find first non script/style node
      const element = this.content.firstElementChild;
      const ids = this.content.querySelectorAll('[id]')

      let init
      const script = this.content.querySelector('script');
      if (script.type === 'module') {
        // FIXME: top-level module exports (can be supported by native declarative custom-elements, some service-workers hack etc)
        // see https://2ality.com/2019/10/eval-via-import.html
      }
      else if (script.hasAttribute('scoped')) {
        init = new Function(`refs`, `with(refs){${script.innerHTML}}`)
      }

      const style = this.content.querySelector('style')

      let ex = element.getAttribute('is'), Root = ex ? document.createElement(ex).constructor : HTMLElement

      // define custom element
      customElements.define(element.localName, class extends Root {
        #refs = {}
        constructor() {
          super()
          ids.forEach(({id}) => Object.defineProperty(this.#refs, id, { get: () => this.querySelector('#' + id) }))
        }
        connectedCallback() {
          // prerender defined children before actual adding to DOM
          this.append(...element.cloneNode(true).childNodes)

          init.call(this, this.#refs)
          // FIXME: add refs when child content is parsed
        }
      }, ex ? {extends: ex} : null)

      mo.disconnect()
    })
    mo.observe(this.content, {childList: true, subtree: true})
  }
}

customElements.define('custom-element', ElementTemplate, { extends:'template' })
