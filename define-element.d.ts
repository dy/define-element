export {}

type PropType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'

interface ProcessorState {
  host: HTMLElement
  [key: string]: any
}

type Processor = (root: Element | ShadowRoot, state: ProcessorState) => void

declare global {
  interface HTMLElementTagNameMap {
    'define-element': DefineElementElement
  }

  class DefineElementElement extends HTMLElement {
    /** Template engine callback. One global processor at a time. */
    static processor: Processor | null
  }
}
