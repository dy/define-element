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
  let c = 0, token = '', op, _='_';

  // FIXME: nothing bad in inlining these into a cycle
  seq = seq
    .replace(/"[^"\\\n\r]*"/g, m => (ctx[_+c]=m,_+c++))
    .replace(/\s*/g,'')
    .replace(/\b(?:true|false|null)\b/g, m => (ctx[_+c]=m=='null'?null:m=='true',_+c++))
    .replace(/\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+\b)?/g, m => (ctx[_+c]=parseFloat(m),_+c++))

  for (let op of operators) {
    seq = proc(seq)
    function proc(seq) {
      if (seq.map) return seq.map(proc)
      if (seq.includes(op)) return [op, ...seq.split(op)]
      return seq
    }
  }
  console.log(seq, ctx)

  // for (let i=0, ch; i < str.length; i++) {
  //   ch = str[i]
  //   if (cur.type && ch === cur.type[1]) { // )]}
  //     if (token) cur.push(token), token = ''
  //     cur = cur[0]
  //   }
  //   else if (group[ch]) { // ([{
  //     if (token) cur.push(token, ch), token = '';
  //     cur.push(cur = [cur]), cur.type = ch+group[ch]
  //   }
  //   else if (operators[op = ch+str[i+1]] || operators[op = ch]) {
  //     if (op !== cur[0]) cur.push(cur = [op])  // a + b - c → ['+', a, ['-', b, c]]
  //     if (token) cur.push(token), token=''
  //     i+=op.length-1
  //   }
  //   else {
  //     token += ch;
  //   }
  // }

  // if (token) cur.push(token)

  return seq
}
