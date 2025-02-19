/**
 * Split haystack on the first occurence of needle (or partial needle at the suffix)
 * @example splitOn("abc---def", "---") // ["abc", "---", "def"]
 * @example splitOn("abc--", "---") // ["abc", "--", ""]
 * @example splitOn("abc", "---") // ["abc", "", ""]
 * @example splitOn("abc---def---ghi", "---") // ["abc", "---", "def---ghi"]
 * @example splitOn("abc---def---ghi", "--") // ["abc", "--", "-def---ghi"]
 * @example splitOn("abc-def-ghi", "---") // ["abc-def-ghi", "", ""]
 * @example splitOn("abc-def-ghi", "def") // ["abc-", "def", "-ghi"]
 * @example splitOn("abc-def-ghi", /-.*-/) // ["abc", "-def-", "ghi"]
 * @example splitOn("abc-de", /-.*-/) // ["abc", "-de", ""]
 * @param haystack the string to split
 * @param needle the string or regex to split on
 * @note only some regex features are supported
 * @returns an array of strings
 */
export default function splitOn(
  haystack: string,
  needle: string | RegExp
): [string, string, string] {
  const re = new RegExp(`^(.*?)(${toPrefixRegexSource(needle)})(.*)$`, 's');
  const match = re.exec(haystack);
  if (!match) return [haystack, '', ''];
  return [match[1], match[2], match[3]];
}

/** Return a regex matching the needle or any nonempty prefix.
 * @note this is done by parsing the regex and currently only some regex features are supported.
 */
function toPrefixRegexSource(needle: string | RegExp): string {
  const re = (typeof needle === 'string' ? regexpQuote(needle) : needle).source;

  let result = '';

  for (let i = 0; i < re.length; i++) {
    let literal = re[i];
    switch (literal) {
      case '\\':
        literal += re[++i];
        break;
      case '[': {
        // note: this is naive and will break on escaped ]
        const end = re.indexOf(']', i);
        if (end === -1) throw new Error('Missing ]');
        literal = re.slice(i, end + 1);
        i = end;
        break;
      }
      case '+':
      case '*':
      case '?':
      case '^':
      case '$':
        result += literal;
        continue;
      case '(':
      case ')':
      case ']':
      case '{':
      case '}':
      case '|':
        throw new Error(`Unsupported regex feature: ${literal}`);
      case '.':
      default:
      // pass
    }
    result += `(?:${literal}|$)`;
  }

  return result;
}

/** Make a regex matching the given literal string. */
function regexpQuote(literal: string): RegExp {
  return new RegExp(literal.replaceAll(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&'));
}
