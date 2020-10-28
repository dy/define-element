class ElementTemplate extends HTMLTemplateElement {
  constructor() {
    super()
  }
  connectedCallback() {
    // children are added immediately after the element, so we init as fast as content is ready via MO
    const mo = new MutationObserver(() => {
      this.#init()
      mo.disconnect()
    })
    // unfortunately we cannot observe `this`, because template does not get notified after parsing children, so we wait for any other mutation
    mo.observe(this.parentNode, {childList: true, subtree: true})
  }

  #init() {
    // FIXME: find first non script/style node
    this.orig = this.content.firstElementChild

    // FIXME: detect extension case
    // define custom element
    customElements.define(this.orig.localName, class extends HTMLElement {
      constructor() {
        super()
      }
    })
  }
}

customElements.define('custom-element', ElementTemplate, { extends:'template' })
