/**
 * Tee function to split an async iterable into two streams.
 * @param iterable The async iterable to split.
 * @param onNext Callback function to handle each value.
 */
export async function* tee(
  iterable: AsyncIterable<string>,
  onNext: (value: string) => void
): AsyncIterable<string> {
  for await (const value of iterable) {
    onNext(value);
    yield value;
  }
}
