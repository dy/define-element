// Common subset of C/C++, JS, Java, Python, Go, Rust, Perl
// or overset of JSON with operators
// converts expression to lispy syntax
// just call it with passing env
// benefit of lispy result: clear precedence; overload of ops: extend to other langs; manual eval; convention;

export const op1 = '++ -- + - ~ !'
export const op2 = ', || && | ^ & != == in >= > <= < >> << + - % / * ** .'.split(' ')

export function parse (seq) {
  let op, c, ref= v=>`#${refs.push(v)-1}`, refs=[]

  // hide literals
  seq = seq
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => ref(m[0]==='"'?m:parseFloat(m)))
    .replace(/\b(?:true|false|null)\b/g, m => ref(m=='null'?null:m=='true', v))
    .replace(/\s+/g,'')

  // fold unaries
  // for (o1 of op1) for (o2 of op2) seq=seq.replace(o1+o2,ref)

  // fold parens
  while(refs.length!=c) c=refs.length, seq=seq
    .replace(/\(([^\)\]]*)\)/g, (_,c)=>ref(['(',c]))
    .replace(/\[([^\]\)]*)\]/g, (_,c)=>ref(['[',c]))

  // split op2
  const deop = s => Array.isArray(s) ? [s.shift(), ...s.map(deop)]
    : s.includes(op) ? console.log(op,s) || [op, ...s.split(op).map(deop)]
    : s
  for (op of op2) refs=refs.map(s=> Array.isArray(s) ? deop(s) : s), seq=deop(seq)

  // unfold parens
  const unfold = (s,c,v) =>
    Array.isArray(s) ? [s.shift(), ...s.map(unfold)]
    : typeof s === 'string' && ~(c = s.indexOf('#')) ? (
      v = refs[s.slice(c+1)],
      c = s.slice(0,c),
      c ? (v[0]=='['?['.',c,unfold(v[1])] : [c,unfold(v[1])])
      : v[0]=='(' ? unfold(v[1]) : unfold(v)
    )
    : s

  seq = unfold(seq)

  return seq
}

export function evaluate (seq, ctx) {

}

export default function (str, ctx) {
}
