// Common subset of C/C++, JS, Java, Python, Go, Rust, Perl
// or overset of JSON with operators
// converts expression to lispy syntax
// just call it with passing env

// group = {'(':')','[':']', '{':'}'}
export const operators = '|| && | ^ & != == in >= > <= < >> << - + % / * ** .'.split(' ')

// TODO: infuse eval here
// TODO: handle numbers, likely without dlv
// TODO: convert to lispy notation [op, a, b, c...]
// benefit of lispy result: clear precedence; overload of ops: extend to other langs; manual eval; convention;
export function parse (seq, ctx={}) {
  let op, vals=[], c, ref= v=>`#${vals.push(v)-1}`

  // hide literals
  seq = seq
    .replace(/"[^"\\\n\r]*"/g, ref)
    .replace(/\s*/g,'')
    .replace(/\b(?:true|false|null)\b/g, m => ref(m=='null'?null:m=='true', v))
    .replace(/(?<!#)\d+(?:\.\d*)?(?:[eE][+\-]?\d+\b)?/g, m => ref(parseFloat(m)))

  // fold parens
  while(vals.length!=c) c=vals.length, seq=seq
    .replace(/\([^\)\]]*\)/g, ref)
    .replace(/\[[^\]\)]*\]/g, ref)

  // split operators
  const deop = s => Array.isArray(s) ? [s.shift(), ...s.map(deop)]
    : typeof s === 'string' && s.includes(op) ? [op, ...s.split(op).map(deop)]
    : s

  vals = vals.map(s => s[0]=='('||s[0]=='['? [s[0], s.slice(1,-1)] : s)
  for (op of operators)
    vals=vals.map(s=> s[0]!='"' ? deop(s) : s), seq=deop(seq)

  // unfold parens
  const unfold = (s,c,v) =>
    Array.isArray(s) ? [s.shift(), ...s.map(unfold)]
    : typeof s === 'string' && ~(c = s.indexOf('#')) ? (
      v = vals[s.slice(c+1)],
      c = s.slice(0,c),
      c ? (v[0]=='['?['.',c,unfold(v[1])] : [c,unfold(v[1])])
      : v[0]=='(' ? unfold(v[1]) : unfold(v)
    )
    : s

  seq = unfold(seq)

  return seq
}

