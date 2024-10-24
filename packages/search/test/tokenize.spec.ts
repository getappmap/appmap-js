import { symbols, words, fileTokens } from '../src/tokenize';

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

  it('should extract file tokens (symbols and words) from the content', () => {
    const result = fileTokens(content, fileExtension);
    expect(result.symbols).toEqual(['example', 'method1', 'method2']);
    expect(result.words).toEqual(['class', 'public', 'public', 'void', 'void']);
  });
});
