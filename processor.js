export default {
  createCallback(instance, parts, params) {
    this.processCallback(instance, parts, params)
  },
  processCallback(instance, parts, params) {
    if (typeof params !== 'object' || !params) return
    for (const part of parts) {
      if (!(part.expression in params)) continue
      const value = (params)[part.expression] ?? ''
      if (
        typeof value === 'boolean' &&
        part instanceof AttributeTemplatePart &&
        typeof part.element[part.attributeName] === 'boolean'
      ) {
        part.booleanValue = value
      } else {
        part.value = String(value)
      }
    }
  }
}
