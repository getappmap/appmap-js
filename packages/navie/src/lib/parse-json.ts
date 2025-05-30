import { warn } from 'console';
import trimFences from './trim-fences';

/**
 * Look within the text for opening and closing square brackets.
 * If found, return the text within the brackets. This is a fallback
 * in case proper JSON cannot be found within trimmed fences.
 */
function findArray(text: string): string | undefined {
  const array = text.match(/\[.*\]/s);
  return array ? array[0] : undefined;
}

/**
 * Look within the text for opening and closing curly braces.
 * If found, return the text within the braces. This is a fallback
 * in case proper JSON cannot be found within trimmed fences.
 */
export function findObject(text: string): string | undefined {
  const object = text.match(/\{.*\}/s);
  return object ? object[0] : undefined;
}

export default function parseJSON<T>(
  text: string,
  warnOnError: boolean,
  warning?: string | undefined
): T | undefined {
  const sanitizedTerms = trimFences(text);

  const parse = (chunk: string): T | undefined => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(chunk);
    } catch (err) {
      if (warnOnError) {
        warn(warning || 'Failed to parse JSON');
        warn(text);
        warn(err);
      }
      return undefined;
    }
  };

  let result = parse(sanitizedTerms);
  if (result === undefined) {
    if (warnOnError) warn('Failed to parse JSON, attempting to parse as array or object.');

    const chunk = findArray(sanitizedTerms) || findObject(sanitizedTerms);
    if (chunk) result = parse(chunk);
  }
  return result;
}

/**
 * Tries to parse the text as JSON using the provided parsers.
 * If the text cannot be parsed and all parsers fail, an error is thrown.
 * @param text The text to parse
 * @param parsers A list of parsers to try in order
 * @returns The parsed JSON object
 */
export function tryParseJson<T>(
  text: string,
  ...parsers: Array<(text: string) => string | undefined>
): T | undefined {
  // First try to parse the text outright.
  try {
    return JSON.parse(text) as T;
  } catch {
    // ignore
  }

  // If that fails, try each parser in order.
  for (const parser of parsers) {
    const result = parser(text);
    if (result) {
      try {
        return JSON.parse(result) as T;
      } catch {
        // ignore
      }
    }
  }

  throw new Error('failed to parse JSON');
}
