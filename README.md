# easy-regex

## WIP Readme

**Fluent, type-safe regex builder for TypeScript**

```ts
import { regex } from 'easy-regex';

const email = regex()
  .start()
  .word().oneOrMore()
  .literal('@')
  .word().oneOrMore()
  .literal('.')
  .letters(2, 3)
  .end();

email.test('hi@x.ai'); // true
email.pattern; // "^\\w+@\\w+\\.[a-zA-Z]{2,3}$"