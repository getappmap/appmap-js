/**
 * Checks if a string is empty (ie. all-whitespace) and applies fallback if so.
 * @param str
 * @param fallback
 * @returns str or fallback
 * @example
 * stringOrDefault('', 'fallback') // 'fallback'
 * stringOrDefault('  ', 'fallback') // 'fallback'
 * stringOrDefault('hello', 'fallback') // 'hello'
 * stringOrDefault('  hello  ', 'fallback') // '  hello  '
 */
export default function stringOrDefault(str: string, fallback: string): string {
  if (str.trim() === '') return fallback;
  else return str;
}
