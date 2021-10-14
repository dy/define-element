// Common subset of C/C++, JS, Java, Python, Go, Rust, Perl
// or overset of JSON with operators
// converts expression to lispy syntax
// just call it with passing env
// benefit of lispy result: clear precedence; overload of ops: extend to other langs; manual eval; convention;

export const op1 = '++ -- + - ~ !'.split(' ')
export const op2 = ', || && | ^ & != == in >= > <= < >> << + - % / * ** .'.split(' ')
// const ure = new RegExp(`(^|${op2.join('|')})(${op1.join('|')})`)

export function parse (seq) {
  let op, c, v=[], g=[seq]

  // ref literals
  g[0]=g[0]
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]==='"'?m:parseFloat(m))-1}`)
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\s+/g,'')

  // ref groups
  while(g.length!=c) c=g.length, g[0]=g[0]
    .replace(/\(([^\)\]]*)\)/g, (_,c)=>`#g${g.push(c)-1}`)
    .replace(/\[([^\]\)]*)\]/g, (_,c)=>`#p${g.push(c)-1}`)

  const oper = s => s.includes(op) ? [op, ...s.split(op)] : s

  // for (op of op1) g=g.map()
  for (op of op2) g=g.map(s =>  Array.isArray(s) ? [s.shift(), ...s.map(oper)] : oper(s))

  const deref = (s,c,p,i) => Array.isArray(s) ? [s.shift(), ...s.map(deref)]
    : ~(c = s.indexOf('#')) ? (
      i = s.slice(c+2), p=g[i],
      s[c+1] == 'g' ? (c ? [s.slice(0,c),deref(p)] : deref(p))
      : s[c+1] == 'p' ? ['.',s.slice(0,c),deref(p)]
      : v[i]
    )
    : s
  seq = deref(g[0])

  return seq
}

export function evaluate (seq, ctx) {

}

export default function (str, ctx) {
}
