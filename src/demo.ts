import { regex } from './index.js';

const testPattern = (
  name: string,
  builder: ReturnType<typeof regex>,
  valid: string[],
  invalid: string[]
) => {
  const r = builder;
  console.log(`\n🔹 ${name}`);
  console.log('   Pattern:', r.toString());
  console.log('   Type:   ', r.pattern);

  const fmt = (arr: string[], ok: boolean) =>
    arr.map(s => `${ok ? '✅' : '❌'} "${s}" → ${r.test(s)}`).join(', ');

  console.log('   ' + fmt(valid, true));
  console.log('   ' + fmt(invalid, false));
};

/* ------------------------------------------------------------------ */
/* 🚀 1. Anchors & Literals                                           */
/* ------------------------------------------------------------------ */
testPattern(
  'SSN (123-45-6789)',
  regex()
    .start()
    .digits(3)
    .literal('-')
    .digits(2)
    .literal('-')
    .digits(4)
    .end(),
  ['123-45-6789'],
  ['123456789', 'abc-de-fghi']
);

/* ------------------------------------------------------------------ */
/* 🔤 2. Character Classes                                            */
/* ------------------------------------------------------------------ */
testPattern(
  'Username: letters + digits',
  regex()
    .start()
    .letter()
    .letters(2)
    .digit()
    .digits(2, 4)
    .end(),
  ['Aab12', 'XyZ9999'],
  ['ab1', 'A1', 'abc!12']
);

testPattern(
  'Hex Color: #abc or #a1b2c3',
  regex()
    .start()
    .literal('#')
    .group(r =>
      r.literal('red')
        .or(rr => rr.literal('green'))
        .or(rr => rr.literal('blue'))
    )
    .end(),
  ['#abc', '#A1B2C3', '#a1b'],
  ['#ggg', '#ab', '#', '#a1b2c3d']
);

testPattern(
  'Password: no spaces or < >',
  regex()
    .start()
    .noneOf(' <>').oneOrMore()
    .end(),
  ['pass', 'hello123'],
  ['hi there', 'bad<']
);

/* ------------------------------------------------------------------ */
/* ✉️ 3. Word, Any & Basic Composition                                */
/* ------------------------------------------------------------------ */
testPattern(
  'Simple Email',
  regex()
    .start()
    .word()
    .literal('@')
    .word()
    .literal('.')
    .letters(2, 3)
    .end(),
  ['hi@x.ai', 'bob@mail.com'],
  ['hi@x', '@x.ai', 'hi@x.abcdef']
);

testPattern(
  'Any 5 chars',
  regex().start().any().repeat(5).end(),
  ['abcde', '12345', 'a1b2c'],
  ['ab', 'abcdef']
);

/* ------------------------------------------------------------------ */
/* 🔁 4. Quantifiers                                                  */
/* ------------------------------------------------------------------ */
testPattern(
  'Optional dash',
  regex().start().digits(3).literal('-').maybe().digits(2).end(),
  ['123-45', '12345'],
  ['12-3', '123-4']
);

testPattern(
  'One or more digits',
  regex().start().digit().oneOrMore().end(),
  ['1', '123', '999'],
  ['', 'abc']
);

testPattern(
  'Zero or more spaces',
  regex().start().literal('a').space().zeroOrMore().literal('b').end(),
  ['ab', 'a   b'],
  ['axb']
);

/* ------------------------------------------------------------------ */
/* ☎️ 5. Realistic Patterns                                           */
/* ------------------------------------------------------------------ */
testPattern(
  'Phone: (123) 456-7890',
  regex()
    .start()
    .literal('(')
    .digits(3)
    .literal(') ')
    .digits(3)
    .literal('-')
    .digits(4)
    .end(),
  ['(123) 456-7890'],
  ['(12) 345-6789', '(123)456-7890']
);

testPattern(
  'IPv4 Segment: 0–255',
  regex().start().digits(1, 3).wordBoundary().end(),
  ['0', '192', '255'],
  ['256', 'abc']
);

testPattern(
  'URL',
  regex()
    .start()
    .literal('https?://')
    .word()
    .literal('.')
    .letters(2, 3)
    .end(),
  ['http://google.com', 'https://x.ai'],
  ['ftp://site.com', 'https://invalid']
);

testPattern(
  'Password: ≥8 chars, 1 uppercase, 1 digit',
  regex()
    .start()
    .lookahead('(?=.*[A-Z])')
    .lookahead('(?=.*\\d)')
    .any().atLeast(8)
    .end(),
  ['Hello123', 'A1b2c3d4'],
  ['password', 'HELLO', 'short1']
);
/* ------------------------------------------------------------------ */
/* 🎨 6. Fun / Showcase Patterns                                      */
/* ------------------------------------------------------------------ */
testPattern(
  'Twitter Handle',
  regex()
    .start()
    .literal('@')
    .anyOf('a-zA-Z0-9_').between(3, 15).end(),
  ['@elonmusk', '@dev123'],
  ['@a', 'user', '@waytoolonghandle']
);

testPattern(
  'Markdown Heading',
  regex()
    .start()
    .literal('#').oneOrMore()
    .space()
    .end(),
  ['# Title', '### Subsection'],
  ['Title', '##']
);

/* testPattern(
  'Color Names (Alternation)',
  regex()
    .start()
    .group(r =>
      r()
        .literal('red')
        .or(rr => rr().literal('green'))
        .or(rr => rr().literal('blue'))
    )
    .end(),
  ['red', 'green', 'blue'],
  ['yellow', 'orange']
);  */
/* ------------------------------------------------------------------ */
/* 🧠 7. Type Inference Showcase                                      */
/* ------------------------------------------------------------------ */
const urlSlug = regex()
  .start()
  .letters(1)
  .word().zeroOrMore()
  .literal('-')
  .word()
  .end();

console.log('\n🧠 Type Inference');
console.log('   Pattern Type:', urlSlug.pattern);

/* ------------------------------------------------------------------ */
/* 🚫 8. Error Cases (Optional Showcase)                              */
/* ------------------------------------------------------------------ */
// Uncomment to verify TypeScript errors:
// regex().oneOrMore();           // Error: must follow a token
// regex().digits(-1);            // Error: positive integer expected
// regex().literal(123);          // Error: must be string

console.log('\n✅ Demo complete!');
