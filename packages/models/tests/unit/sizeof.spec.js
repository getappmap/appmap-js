import { sizeof } from '../../src/util';

describe('sizeof', () => {
  it('calculates size of simple objects', () => {
    const obj = { a: 1 };
    // {"a":1} -> 7 chars
    expect(sizeof(obj)).toEqual(7);
  });

  it('calculates size of arrays', () => {
    const arr = [1, 2];
    // [1,2] -> 5 chars
    expect(sizeof(arr)).toEqual(5);
  });

  it('handles nested objects', () => {
    const obj = { a: { b: 1 } };
    // {"a":{"b":1}} -> 13 chars
    expect(sizeof(obj)).toEqual(13);
  });

  describe('fallback behavior', () => {
    let stringifySpy;
    const originalStringify = JSON.stringify;

    beforeEach(() => {
      // Mock JSON.stringify to throw RangeError for objects with a specific flag
      stringifySpy = jest.spyOn(JSON, 'stringify').mockImplementation((val) => {
        if (val && typeof val === 'object' && val !== null && val.forceFail) {
          throw new RangeError('Invalid string length: forced by test');
        }
        return originalStringify(val);
      });
    });

    afterEach(() => {
      stringifySpy.mockRestore();
    });

    it('falls back to recursive calculation on RangeError', () => {
      const hugeObj = {
        forceFail: true,
        a: 1,
        b: [2, 3],
      };
      // We manually calculate expected size or temporarily bypass the mock
      // {"forceFail":true,"a":1,"b":[2,3]} length is 34
      expect(sizeof(hugeObj)).toEqual(34);
      expect(stringifySpy).toHaveBeenCalled();
    });

    it('correctly calculates size of strings with escaped characters', () => {
      const obj = {
        forceFail: true,
        str: 'hello "world"\n',
      };

      const expected = originalStringify(obj).length;

      expect(sizeof(obj)).toEqual(expected);
    });

    it('handles arrays with undefined, null, functions', () => {
      const obj = {
        forceFail: true,
        arr: [undefined, null, () => {}, 123],
      };

      const expected = originalStringify(obj).length;
      expect(sizeof(obj)).toEqual(expected);
    });

    it('handles objects with undefined, null, functions', () => {
      const obj = {
        forceFail: true,
        a: undefined,
        b: null,
        c: () => {},
        d: 123,
      };

      const expected = originalStringify(obj).length;
      expect(sizeof(obj)).toEqual(expected);
    });

    it('detects circular references and throws TypeError', () => {
      const obj = {
        forceFail: true,
      };
      obj.self = obj;

      expect(() => sizeof(obj)).toThrow(TypeError);
      expect(() => sizeof(obj)).toThrow('Converting circular structure to JSON');
    });

    it('handles deep nesting', () => {
      const obj = {
        forceFail: true,
        level1: {
          level2: {
            level3: [1, 2, 3],
          },
        },
      };

      const expected = originalStringify(obj).length;
      expect(sizeof(obj)).toEqual(expected);
    });
  });
});
