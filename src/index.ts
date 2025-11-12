export type Pattern = string;

/*                         Helper utilities                           */
const escape = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/*                        Builder implementation                      */
export const regex = <P extends Pattern = ''>(
  parts: string[] = []
): RegexBuilder<P> => {
  return new Proxy({} as any, {
    get: (_, prop: string) => {
      if (prop === 'toRegExp')
        return (flags = '') => new RegExp(parts.join(''), flags);
      if (prop === 'toString') return () => parts.join('');
      if (prop === 'test')
        return (s: string, f = '') => new RegExp(parts.join(''), f).test(s);
      if (prop === 'pattern') return parts.join('') as P;

      return (...args: any[]) => {
        const newParts: string[] = [...parts];

        if (['maybe', 'oneOrMore', 'zeroOrMore'].includes(prop)) {
          if (newParts.length === 0) {
            throw new Error(`${prop}() must follow a pattern part`);
          }

          const last = newParts[newParts.length - 1];
          if (prop === 'oneOrMore' && last === '\\w+') {
            throw new Error(`Cannot apply oneOrMore() after .word() — it already includes +`);
          }

          if (last === '\\w+' && (prop === 'zeroOrMore' || prop === 'maybe')) {
            const suffix = prop === 'zeroOrMore' ? '*' : '?';
            newParts[newParts.length - 1] = '\\w' + suffix;
            return regex(newParts as any);
          }

          if (/[?*+]$/.test(last)) {
            throw new Error(`Cannot apply ${prop}() after another quantifier`);
          }

          const suffix =
            prop === 'maybe' ? '?' : prop === 'oneOrMore' ? '+' : '*';
          newParts[newParts.length - 1] += suffix;
          return regex(newParts as any);
        }

        if (['repeat', 'between', 'atLeast'].includes(prop)) {
          if (newParts.length === 0) {
            throw new Error(`${prop}() must follow a pattern part`);
          }
          const last = newParts[newParts.length - 1];

          if (last === '\\w+') {
            throw new Error(`Cannot apply ${prop}() after .word() — it already includes +`);
          }
          const min = args[0];
          const max = args[1];
          if (!Number.isInteger(min) || min < 0) {
            throw new Error(`${prop}() min must be a non-negative integer`);
          }

          let quant = `{${min}}`;
          if (prop === 'atLeast') {
            quant = `{${min},}`;
          } else if (prop === 'between') {
            if (!Number.isInteger(max) || max < min) {
              throw new Error(`${prop}() max must be >= min and integer`);
            }
            quant = `{${min},${max}}`;
          }

          newParts[newParts.length - 1] += quant;
          return regex(newParts as any);
        }

        if (prop === 'lookahead') {
          let pattern: string;
          if (typeof args[0] === 'string') {
            pattern = args[0];
          } else if (typeof args[0] === 'function') {
            pattern = args[0](regex()).toString();
          } else {
            throw new Error(`lookahead() requires a string or builder function`);
          }
          newParts.push(pattern);
          return regex(newParts as any);
        }

        if (prop === 'or' || prop === 'group') {
          const fn = args[0];
          if (typeof fn !== 'function') {
            throw new Error(`${prop}() requires a builder function: .${prop}(r => r.literal('x'))`);
          }
          const nested = fn(regex()).toString();
          const wrapped = prop === 'or' ? `|${nested}` : `(${nested})`;
          newParts.push(wrapped);
          return regex(newParts as any);
        }

        let addition = '';

        switch (prop) {
          case 'start':
            addition = '^';
            break;
          case 'end':
            addition = '$';
            break;
          case 'digit':
            addition = '\\d';
            break;
          case 'word':
            addition = '\\w+';
            break;
          case 'any':
            addition = '.';
            break;
          case 'letter':
            addition = '[a-zA-Z]';
            break;
          case 'space':
            addition = ' ';
            break;
          case 'tab':
            addition = '\\t';
            break;
          case 'wordBoundary':
            addition = '\\b';
            break;

          case 'digits': {
            const min = args[0];
            const max = args[1];
            if (!Number.isInteger(min) || min < 0)
              throw new Error('digits() min must be a non-negative integer');

            let quant = `{${min}}`;
            if (max !== undefined) {
              if (!Number.isInteger(max) || max < min)
                throw new Error('digits() max must be >= min and integer');
              quant = `{${min},${max}}`;
            }
            addition = `\\d${quant}`;
            break;
          }

          case 'letters': {
            const min = args[0];
            const max = args[1];
            if (!Number.isInteger(min) || min < 0)
              throw new Error('letters() min must be a non-negative integer');

            let quant = `{${min}}`;
            if (max !== undefined) {
              if (!Number.isInteger(max) || max < min)
                throw new Error('letters() max must be >= min and integer');
              quant = `{${min},${max}}`;
            }
            addition = `[a-zA-Z]${quant}`;
            break;
          }

          case 'literal': {
            const str = args[0];
            if (typeof str !== 'string')
              throw new Error('literal() requires a string');
            addition = escape(str);
            break;
          }

          case 'anyOf':
          case 'noneOf': {
            const chars = args[0];
            if (typeof chars !== 'string')
              throw new Error(`${prop}() requires a string`);
            const escaped = escape(chars).replace(/]/g, '\\]');
            addition = prop === 'anyOf' ? `[${escaped}]` : `[^${escaped}]`;
            break;
          }

          default:
            throw new Error(`Unknown method: ${prop}`);
        }

        newParts.push(addition);
        return regex(newParts as any);
      };
    },
  }) as any;
};

/*                              Public API types                      */
export interface RegexBuilder<P extends Pattern = ''> {
  start: () => RegexBuilder<`${P}^`>;
  end: () => RegexBuilder<`${P}$`>;
  digit: () => RegexBuilder<`${P}\\d`>;
  digits: {
    (n: number): RegexBuilder<`${P}\\d{${number}}`>;
    (min: number, max: number): RegexBuilder<`${P}\\d{${number},${number}}`>;
  };
  word: () => RegexBuilder<`${P}\\w+`>;
  any: () => RegexBuilder<`${P}.`>;
  literal: <S extends string>(s: S) => RegexBuilder<`${P}${Escape<S>}`>;

  letter: () => RegexBuilder<`${P}[a-zA-Z]`>;
  letters: {
    (n: number): RegexBuilder<`${P}[a-zA-Z]{${number}}`>;
    (min: number, max: number): RegexBuilder<`${P}[a-zA-Z]{${number},${number}}`>;
  };

  anyOf: <S extends string>(chars: S) => RegexBuilder<`${P}[${Escape<S>}]`>;
  noneOf: <S extends string>(chars: S) => RegexBuilder<`${P}[^${Escape<S>}]`>;

  space: () => RegexBuilder<`${P} `>;
  tab: () => RegexBuilder<`${P}\\t`>;
  wordBoundary: () => RegexBuilder<`${P}\\b`>;

  maybe: () => RegexBuilder<`${P}?`>;
  oneOrMore: () => RegexBuilder<`${P}+`>;
  zeroOrMore: () => RegexBuilder<`${P}*`>;

  repeat: (n: number) => RegexBuilder<`${P}{${number}}`>;
  between: (min: number, max: number) => RegexBuilder<`${P}{${number},${number}}`>;
  atLeast: (n: number) => RegexBuilder<`${P}{${number},}`>;

  or: <Q extends Pattern>(
    builder: (r: RegexBuilder<''>) => RegexBuilder<Q>
  ) => RegexBuilder<`${P}|${Q}`>;

  group: <Q extends Pattern>(
    builder: (r: RegexBuilder<''>) => RegexBuilder<Q>
  ) => RegexBuilder<`${P}(${Q})`>;

  lookahead: {
    (pattern: string): RegexBuilder<`${P}${string}`>;
    <Q extends Pattern>(builder: (r: RegexBuilder<''>) => RegexBuilder<Q>): RegexBuilder<`${P}${Q}`>;
  };

  toRegExp: (flags?: string) => RegExp;
  toString: () => string;
  test: (str: string, flags?: string) => boolean;
  pattern: P;
}

/*                     Type-level escape for literals                 */
type Escape<S extends string> = S extends `${infer C}${infer Rest}`
  ? C extends '.' | '+' | '*' | '?' | '^' | '$' | '(' | ')' | '{' | '}' | '[' | ']' | '|' | '\\'
  ? `\\${C}${Escape<Rest>}`
  : `${C}${Escape<Rest>}`
  : S;