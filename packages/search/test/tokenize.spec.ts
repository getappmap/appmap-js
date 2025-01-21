import { symbols, words, fileTokens, batch } from '../src/tokenize';

describe('FileTokens', () => {
  const content = `
    class Example {
      public void method1() { }
      public void method2() { }
    }
  `;

  const fileExtension = 'java';

  it('should extract symbols from the content', () => {
    const result = symbols(content, fileExtension);
    expect(result).toEqual(['Example', 'method1', 'method2']);
  });

  it('should extract words from the content', () => {
    const result = words(content);
    expect(result).toEqual([
      'class',
      'Example',
      'public',
      'void',
      'method1',
      'public',
      'void',
      'method2',
    ]);
  });

  it('should extract file tokens (symbols and words) from the content', async () => {
    const result = await fileTokens(content, fileExtension);
    expect(result.symbols).toEqual(['example', 'method1', 'method2']);
    expect(result.words).toEqual(['class', 'public', 'public', 'void', 'void']);
  });

  it('yields to the event loop periodically', async () => {
    const result = fileTokens('aaa\n'.repeat(10000), 'example');
    const winner = await Promise.race([
      result,
      new Promise<'pass'>((resolve) => setImmediate(() => resolve('pass'))),
    ]);
    expect(winner).toStrictEqual('pass');
    await expect(result).resolves.toBeDefined();
  });

  describe('batch', () => {
    it('should split the content into batches of lines', () => {
      const a = 'aaa\n'.repeat(100);
      const b = 'bbb\n'.repeat(100);
      const c = 'ccc\n'.repeat(50);
      const content = a + b + c;
      const result = batch(content, 100);
      expect(result).toStrictEqual([a.slice(0, -1), b.slice(0, -1), c]);
    });

    it('returns text in batches which can be joined by new line to reconstruct the original text', () => {
      const a = 'aaa\n'.repeat(100);
      const b = 'bbb\n'.repeat(100);
      const c = 'ccc\n'.repeat(50);
      const content = a + b + c;
      const result = batch(content, 100);
      const joined = result.join('\n');
      expect(joined).toEqual(content);
    });

    it('filters out lines longer than the max line length', () => {
      const maxLen = 10;
      const result = batch(`${'a'.repeat(maxLen + 1)}\nb\n${'c'.repeat(maxLen)}`, 100, maxLen);
      expect(result).toStrictEqual([`b\n${'c'.repeat(maxLen)}`]);
    });
  });
});
