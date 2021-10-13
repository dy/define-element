export default {
  createCallback(instance, parts, params) {
    this.processCallback(instance, parts, params)
  },
  processCallback(instance, parts, params) {
    if (typeof params !== 'object' || !params) return
    for (const part of parts) {
      calc(part.expression, (value) => {})

      const value = part.expression.includes('.')
        ? dprop(params, part.expression) // a.b.c
        : params[part.expression] ?? ''

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


function dprop(obj, key, def) {
  key = key.split ? key.split('.') : key
  for (let p = 0; p < key.length; p++) obj = obj ? obj[key[p]] : undefined
  return obj ?? def
}
