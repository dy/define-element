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

// universal cross-lang operators (C/C++/JS/Java/Python/Go/Rust/)
const operators = {
  '*':(a,b)=>a*b,
  '/':(a,b)=>a/b,
  '+':(a=0,b)=>a+b,
  '-':(a=0,b)=>a-b,
  '%':(a,b)=>a%b,
  '|':(a,b)=>a|b,
  '&':(a,b)=>a&b,
  '^':(a,b)=>a^b,
  '<<':(a,b)=>a<<b,
  '>>':(a,b)=>a>>b,
  '||':(a,b)=>a||b,
  '&&':(a,b)=>a&&b,
  '==':(a,b)=>a==b,
  '!=':(a,b)=>a!=b,
  '>':(a,b)=>a>b,
  '>=':(a,b)=>a>=b,
  '<':(a,b)=>a<b,
  '<=':(a,b)=>a<=b,
  '!':(a,b)=>!b,
  '++':(a=b,b=a)=>++b,
  '--':(a=b,b=a)=>--b,
  // '.':(a,b)=>a[b],
  '(':(a,b)=>a(b),
  '[':(a,b)=>a[b]
},
group = {'(':')','[':']', '{':'}'}

// tokenize expression
export function parse (str) {
  let i = -1,
      cur = [null],  // eg. [parent, '"a"', '+', ['b' + 'c']]
      token = '', op, n;

  while (++i < str.length) {
    let ch = str[i]
    if (ch === '"') {
      cur.push(str.slice(i, i = 1+str.indexOf('"', i+1)))
    }
    else if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {}
    else if (cur.type && ch === cur.type[1]) { // )]}
      if (token) {cur.push(token), token = ''}
      cur = cur[0]
    }
    else if (group[ch]) { // ([{
      if (token) cur.push(token, operators[ch]), token = '';
      cur.push(cur = [cur]), cur.type = ch+group[ch]
    }
    else if (op = operators[ch+str[i+1]] || operators[ch]) {
      if (token) {cur.push(token), token = ''}
      cur.push(op);
      token = '';
      i+=op.name.length-1
    }
    else {
      token += ch;
    }
  }

  token && cur.push(token)

  return cur
}

function dprop(obj, key, def) {
  key = key.split ? key.split('.') : key
  for (let p = 0; p < key.length; p++) obj = obj ? obj[key[p]] : undefined
  return obj ?? def
}
