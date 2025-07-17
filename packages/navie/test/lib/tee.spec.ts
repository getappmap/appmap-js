// packages/navie/test/lib/tee.spec.ts

import { tee } from '../../src/lib/tee';

describe('tee', () => {
  it('should yield all values and call onNext for each', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const input = async function* () {
      yield 'a';
      yield 'b';
      yield 'c';
    };

    const seen: string[] = [];
    const result: string[] = [];
    for await (const value of tee(input(), (v) => seen.push(v))) {
      result.push(value);
    }
    expect(result).toEqual(['a', 'b', 'c']);
    expect(seen).toEqual(['a', 'b', 'c']);
  });

  it('should work with empty iterable', async () => {
    const input = async function* () {};
    const seen: string[] = [];
    const result: string[] = [];
    for await (const value of tee(input(), (v) => seen.push(v))) {
      result.push(value);
    }
    expect(result).toEqual([]);
    expect(seen).toEqual([]);
  });

  it('should propagate errors from the iterable', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const input = async function* () {
      yield 'ok';
      throw new Error('fail');
    };
    const seen: string[] = [];
    const iter = tee(input(), (v) => seen.push(v));
    const values: string[] = [];
    let error: Error | undefined;
    try {
      for await (const v of iter) {
        values.push(v);
      }
    } catch (e) {
      error = e as Error;
    }
    expect(values).toEqual(['ok']);
    expect(seen).toEqual(['ok']);
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('fail');
  });
});
