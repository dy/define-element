// Common subset of C/C++, JS, Java, Python, Go, Rust, Perl
// or overset of JSON with operators
// converts expression to lispy syntax
// just call it with passing env
// benefit of lispy result: clear precedence; overload of ops: extend to other langs; manual eval; convention;
// TODO: eval JSON, array objects

// precedence order
export const operators = {
  '!':(a,b)=>!a,
  '~':(a,b)=>~a,
  '.':(a,b)=>a[b],
  '**':(a,b)=>a**b,
  '*':(a,b)=>a*b,
  '/':(a,b)=>a/b,
  '%':(a,b)=>a%b,
  '+':(a=0,b)=>a+b,
  '-':(a=0,b)=>a-b,
  '<<':(a,b)=>a<<b,
  '>>':(a,b)=>a>>b,
  '<':(a,b)=>a<b,
  '<=':(a,b)=>a<=b,
  '>':(a,b)=>a>b,
  '>=':(a,b)=>a>=b,
  'in':(a,b)=>a in b,
  '==':(a,b)=>a==b,
  '!=':(a,b)=>a!=b,
  '&':(a,b)=>a&b,
  '^':(a,b)=>a^b,
  '|':(a,b)=>a|b,
  '&&':(a,b)=>a&&b,
  '||':(a,b)=>a||b,
  ',':(a,b)=>b,
}

export function parse (seq) {
  let op, c, v=[], g=[seq], u=[], ops = Object.keys(operators),
    og = ops.map(o=>o.replace(/./g,'\\$&')).join('|'), ore = new RegExp(`(^|${og})(${og})(${og})?`,'g')

  // literals
  g[0]=g[0]
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]==='"'?m:parseFloat(m))-1}`)
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\s+/g,'')
    .replace(ore, (m,o0,o1,o2) => `${o0}@${u.push([o1,o2])-1}`) // up to 2 unary ops

  // groups
  while(g.length!=c) c=g.length, g[0]=g[0]
    .replace(/\(([^\)\]]*)\)/g, (m,c)=>`#g${g.push(c)-1}`)
    .replace(/\[([^\]\)]*)\]/g, (m,c)=>`#p${g.push(c)-1}`)

  // binaries w/precedence
  const oper = (s, l) => Array.isArray(s) ? [s.shift(), ...s.map(oper)]
    : s.includes(op) && (l=s.split(op)).length > 1 ? [op, ...l] : s
  for (op of ops) g=g.map(oper)

  // unwrap
  const deref = (s,c,p,i) => Array.isArray(s) ? [s.shift(), ...s.map(deref)]
    : ~(c = s.indexOf('#')) ? (
      i = s.slice(c+2), p=g[i],
      s[c+1] == 'g' ? (c ? [s.slice(0,c),deref(p)] : deref(p))
      : s[c+1] == 'p' ? ['.',s.slice(0,c),deref(p)]
      // : s[c+1] == 'u' ? [] // TODO: unwrap unary
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
