import XMLMarkdownTransformer from '../../src/lib/xml-markdown-transformer';

describe('XMLMarkdownTransformer', () => {
  let transformer: XMLMarkdownTransformer;
  let callback: jest.Mock;

  beforeEach(() => {
    transformer = new XMLMarkdownTransformer();
    callback = jest.fn();
  });

  test('should transform a complete code block in one chunk', () => {
    const input =
      '<code> <language>javascript</language> <file>example.js</file> <content><![CDATA[console.log("Hello, World!");]]></content> </code>';
    transformer.transform(input, callback);

    expect(callback.mock.calls).toEqual([
      ['<!-- example.js -->\n```javascript\n'],
      ['console.log("Hello, World!");\n```\n'],
    ]);
  });

  test('should transform code block across multiple chunks', () => {
    const chunk1 =
      '<code> <language>javascript</language> <file>example.js</file> <content><![CDATA[console.log("';
    const chunk2 = 'Hello, World!");]]></content> </code>';

    transformer.transform(chunk1, callback);
    transformer.transform(chunk2, callback);

    expect(callback.mock.calls).toEqual([
      ['<!-- example.js -->\n```javascript\n'],
      ['console.log("Hello, World!");\n```\n'],
    ]);
  });

  test('should handle incomplete code blocks gracefully', () => {
    const input =
      '<code> <language>javascript</language> <file>example.js</file> <content><![CDATA[console.log("Hello, World!");';
    transformer.transform(input, callback);

    expect(callback).toHaveBeenCalledWith(input);
  });

  test('should transform multiple code blocks in sequence', () => {
    const chunk1 =
      '<code> <language>javascript</language> <file>example.js</file> <content><![CDATA[console.log("Hello, World!");]]></content> </code>';
    const chunk2 =
      '<code> <language>python</language> <file>example2.py</file> <content><![CDATA[print("Hello, World!")]]></content> </code>';

    transformer.transform(chunk1, callback);
    transformer.transform(chunk2, callback);

    expect(callback.mock.calls).toEqual([
      ['<!-- example.js -->\n```javascript\n'],
      ['console.log("Hello, World!");\n```\n'],
      ['<!-- example2.py -->\n```python\n'],
      ['print("Hello, World!")\n```\n'],
    ]);
  });

  test('should handle non-code content correctly', () => {
    const input = 'This is some regular text';
    transformer.transform(input, callback);

    expect(callback).toHaveBeenCalledWith(input);
  });
});
