import splitOn from './split-on';

/**
 * Replace a needle in a stream with a replacement function.
 * The replacement function is called with the found string and returns an async iterable of strings.
 * The replacement function can be async, and will be awaited.
 * The replacement function can yield multiple strings.
 * The replacement function can be called multiple times if the needle is found multiple times.
 * @param source the source stream
 * @param needle the string or regex to search
 * @param replacement the replacement function
 */
export default async function* replaceStream(
  source: AsyncIterable<string>,
  needle: string | RegExp,
  replacement: (found: string) => AsyncIterable<string>
): AsyncIterable<string> {
  let buffer = '';
  for await (const chunk of source) {
    buffer += chunk;
    while (buffer) {
      const [before, found, after] = splitOn(buffer, needle);
      yield before;
      if (found) {
        if (after) {
          yield* replacement(found);
        } else {
          buffer = found;
          break;
        }
      }
      buffer = after;
    }
  }
}
