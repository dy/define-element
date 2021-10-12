export default {
  createCallback(instance, parts, params) {
    this.processCallback(instance, parts, params)
  },
  processCallback(instance, parts, params) {
    if (typeof params !== 'object' || !params) return
    for (const part of parts) {
      if (!(part.expression in params)) continue
      const value = params[part.expression] ?? ''

      // onclick={{callback}}
      if (typeof value === 'function') {
        part.element[part.attributeName] = value
      }
      // disabled={{bool}}
      else if (
        typeof value === 'boolean' &&
        part instanceof AttributeTemplatePart &&
        typeof part.element[part.attributeName] === 'boolean' // FIXME: not convinced that's necessary
      ) {
        part.booleanValue = value
      }
      // attr={{value}}
      else {
        part.value = String(value)
      }
    }
  }
}
