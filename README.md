# easy-regex

**Fluent, type-safe regex builder for TypeScript**

`easy-regex` is a zero-dependency, fully type-safe regex builder.
It provides a **fluent API** for building complex regular expressions with full **TypeScript inference**, runtime safety, and modern regex features like lookaheads, alternation, and quantifiers.

---

## Features

* Full type inference – see the exact pattern in your IDE
* Fluent API – chain methods like `.digit().maybe()`
* Runtime safety – invalid usage throws clear errors
* Zero dependencies – pure TypeScript
* Supports modern regex features – lookaheads, alternation, quantifiers

---

## Installation

```bash
npm install easy-regex
```

---

## API Reference

### Building Blocks

| Method                | Example                                            | Output        |       |
| --------------------- | -------------------------------------------------- | ------------- | ----- |
| `.start()` / `.end()` | `regex().start().digit().end()`                    | `^\d$`        |       |
| `.digit()`            | `regex().digit().digit()`                          | `\d\d`        |       |
| `.word()`             | `regex().word().word()`                            | `\w+`         |       |
| `.any()`              | `regex().any().any()`                              | `..`          |       |
| `.letter()`           | `regex().letter().letter()`                        | `[a-zA-Z]`    |       |
| `.space()` / `.tab()` | `regex().space().tab()`                            | `\t`          |       |
| `.wordBoundary()`     | `regex().wordBoundary()`                           | `\b`          |       |
| `.literal(str)`       | `regex().literal('https://')`                      | `https:\/\/`  |       |
| `.anyOf(chars)`       | `regex().anyOf('a-f0-9')`                          | `[a-f0-9]`    |       |
| `.noneOf(chars)`      | `regex().noneOf(' <>')`                            | `[^ <>]`      |       |
| `.maybe()`            | `regex().digit().maybe()`                          | `\d?`         |       |
| `.oneOrMore()`        | `regex().digit().oneOrMore()`                      | `\d+`         |       |
| `.zeroOrMore()`       | `regex().space().zeroOrMore()`                     | ` *`          |       |
| `.repeat(n)`          | `regex().digit().repeat(3)`                        | `\d{3}`       |       |
| `.between(min,max)`   | `regex().anyOf('_').between(3,15)`                 | `[_]{3,15}`   |       |
| `.atLeast(n)`         | `regex().any().atLeast(8)`                         | `.{8,}`       |       |
| `.or(r => ...)`       | `regex().literal('cat').or(r => r.literal('dog'))` | `(cat|dog)`   |       |
| `.group(r => ...)`    | `regex().group(r => r.digit().literal('-'))`       | `(\d-)`       |       |
| `.lookahead(str)`     | `regex().lookahead('(?=.*[A-Z])')`                 | `(?=.*[A-Z])` |       |

### Terminal Methods

```ts
const r = regex().digit().oneOrMore();

// Convert to RegExp
r.toRegExp('g');   // /\d+/g

// Get string pattern
r.toString();      // "\d+"

// Test a string
r.test('123');     // true

// Access typed pattern
r.pattern;         // "\d+"
```

---

## Examples

### Password (8+ chars, 1 uppercase, 1 digit)

```ts
const password = regex()
  .start()
  .lookahead('(?=.*[A-Z])')
  .lookahead('(?=.*\\d)')
  .any().atLeast(8)
  .end();
```

### Twitter Handle

```ts
const handle = regex()
  .start()
  .literal('@')
  .anyOf('a-zA-Z0-9_').between(3, 15)
  .end();
```

---

## Type Safety

```ts
const slug = regex()
  .start()
  .letters(1)
  .word().zeroOrMore()
  .literal('-')
  .word()
  .end();

// Hover over `slug.pattern` → "^[a-zA-Z]\w*-\w+$"
```

---

## License

MIT
