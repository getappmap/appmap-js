import stripCodeFences, { removeFenceLines, dedentLines } from '@/lib/stripCodeFences';

describe('removeFenceLines', () => {
  it('should return empty array and null indent for empty input', () => {
    expect(removeFenceLines([])).toEqual({ contentLines: [], openingIndent: null });
  });

  it('should return original lines and null indent if no fences are present', () => {
    const lines = ['line 1', 'line 2'];
    expect(removeFenceLines(lines)).toEqual({
      contentLines: ['line 1', 'line 2'],
      openingIndent: null,
    });
  });

  it('removes opening fences with a language specifier', () => {
    const lines = ['```javascript', 'content line 1', 'content line 2'];
    expect(removeFenceLines(lines)).toEqual({
      contentLines: ['content line 1', 'content line 2'],
      openingIndent: '',
    });
  });

  it('should remove only opening fence (no indent) and return empty indent', () => {
    const lines = ['```', 'content'];
    expect(removeFenceLines(lines)).toEqual({ contentLines: ['content'], openingIndent: '' });
  });

  it('should remove only opening fence (with indent) and return the indent', () => {
    const lines = ['  ```', '  content'];
    expect(removeFenceLines(lines)).toEqual({ contentLines: ['  content'], openingIndent: '  ' });
  });

  it('should remove only closing fence and return null indent', () => {
    const lines = ['content', '```'];
    expect(removeFenceLines(lines)).toEqual({ contentLines: ['content'], openingIndent: null });
  });

  it('should remove both fences (no indent) and return empty indent', () => {
    const lines = ['```', 'content', '```'];
    expect(removeFenceLines(lines)).toEqual({ contentLines: ['content'], openingIndent: '' });
  });

  it('should remove both fences (opening indent) and return the opening indent', () => {
    const lines = ['  ```', '  content line 1', '  content line 2', '```'];
    expect(removeFenceLines(lines)).toEqual({
      contentLines: ['  content line 1', '  content line 2'],
      openingIndent: '  ',
    });
  });

  it('should remove both fences (different indents) and return the opening indent', () => {
    const lines = ['  ```', '  content', '    ```']; // Closing indent is ignored for detection
    expect(removeFenceLines(lines)).toEqual({ contentLines: ['  content'], openingIndent: '  ' });
  });

  it('should handle fences with more than 3 backticks', () => {
    const lines = ['````markdown', 'content', '````'];
    expect(removeFenceLines(lines)).toEqual({ contentLines: ['content'], openingIndent: '' });
  });

  it('should handle fences with indentation and more backticks', () => {
    const lines = ['    ``````', '    content', '    ``````'];
    expect(removeFenceLines(lines)).toEqual({
      contentLines: ['    content'],
      openingIndent: '    ',
    });
  });

  it('should handle single line input (content)', () => {
    const lines = ['just content'];
    expect(removeFenceLines(lines)).toEqual({
      contentLines: ['just content'],
      openingIndent: null,
    });
  });

  it('should handle single line input (fence)', () => {
    const lines = ['```'];
    expect(removeFenceLines(lines)).toEqual({ contentLines: [], openingIndent: '' });
  });

  it('should handle two lines input (both fences)', () => {
    const lines = ['```', '```'];
    expect(removeFenceLines(lines)).toEqual({ contentLines: [], openingIndent: '' });
  });

  it('should handle two lines input (both fences with indent)', () => {
    const lines = ['  ```', '  ```'];
    expect(removeFenceLines(lines)).toEqual({ contentLines: [], openingIndent: '  ' });
  });

  it('should not remove fence-like lines in the middle', () => {
    const lines = ['```', 'line 1', '```', 'line 2', '```'];
    expect(removeFenceLines(lines)).toEqual({
      contentLines: ['line 1', '```', 'line 2'],
      openingIndent: '',
    });
  });
});

describe('dedentLines', () => {
  it('should return empty array for empty input', () => {
    expect(dedentLines([], '  ')).toEqual([]);
  });

  it('should return original lines if indentToRemove is empty', () => {
    const lines = ['  line 1', '  line 2'];
    expect(dedentLines(lines, '')).toEqual(['  line 1', '  line 2']);
  });

  it('should remove the specified indent from lines that start with it', () => {
    const lines = ['  line 1', '  line 2', 'no indent'];
    const indent = '  ';
    expect(dedentLines(lines, indent)).toEqual(['line 1', 'line 2', 'no indent']);
  });

  it('should remove tab indentation', () => {
    const lines = ['\tline 1', '\tline 2', 'no indent'];
    const indent = '\t';
    expect(dedentLines(lines, indent)).toEqual(['line 1', 'line 2', 'no indent']);
  });

  it('should not change lines that do not start with the exact indent', () => {
    const lines = [' line 1', '  line 2', '    line 3'];
    const indent = '  '; // two spaces
    expect(dedentLines(lines, indent)).toEqual([' line 1', 'line 2', '  line 3']);
  });

  it('should handle lines that are shorter than the indent', () => {
    const lines = [' ', '  line 2'];
    const indent = '  ';
    expect(dedentLines(lines, indent)).toEqual([' ', 'line 2']);
  });

  it('should handle lines consisting only of the indent', () => {
    const lines = ['  ', '  line 2'];
    const indent = '  ';
    expect(dedentLines(lines, indent)).toEqual(['', 'line 2']);
  });

  it('should handle empty lines within the content', () => {
    const lines = ['  line 1', '', '  line 3'];
    const indent = '  ';
    expect(dedentLines(lines, indent)).toEqual(['line 1', '', 'line 3']);
  });
});

describe('stripCodeFences', () => {
  it('should handle text without fences', () => {
    const text = 'line 1\nline 2';
    expect(stripCodeFences(text)).toBe('line 1\nline 2');
  });

  it('should handle text with fences but no opening indent', () => {
    const text = '```\ncontent line 1\ncontent line 2\n```';
    expect(stripCodeFences(text)).toBe('content line 1\ncontent line 2');
  });

  it('should remove fences and dedent based on opening fence indent', () => {
    const text = '  ```\n  content line 1\n    indented further\n  line 3\n  ```';
    const expected = 'content line 1\n  indented further\nline 3';
    expect(stripCodeFences(text)).toBe(expected);
  });

  it('should remove only opening fence and dedent', () => {
    const text = '  ```\n  content line 1\n  content line 2';
    const expected = 'content line 1\ncontent line 2';
    expect(stripCodeFences(text)).toBe(expected);
  });

  it('should remove only closing fence and not dedent', () => {
    const text = '  content line 1\n  content line 2\n```';
    const expected = '  content line 1\n  content line 2'; // No dedent applied
    expect(stripCodeFences(text)).toBe(expected);
  });

  it('should handle text with fences but no content', () => {
    const text = '```\n```';
    expect(stripCodeFences(text)).toBe('');
  });

  it('should handle text with indented fences but no content', () => {
    const text = '  ```\n  ```';
    expect(stripCodeFences(text)).toBe('');
  });

  it('should handle empty string input', () => {
    expect(stripCodeFences('')).toBe('');
  });

  it('should handle single line fence', () => {
    expect(stripCodeFences('```')).toBe('');
  });

  it('should handle single line indented fence', () => {
    expect(stripCodeFences('  ```')).toBe('');
  });

  it('should handle single line content', () => {
    expect(stripCodeFences('just content')).toBe('just content');
  });

  it('should preserve empty lines within the content after dedenting', () => {
    const text = '  ```\n  line 1\n\n  line 3\n  ```';
    const expected = 'line 1\n\nline 3';
    expect(stripCodeFences(text)).toBe(expected);
  });

  it('should not dedent if content doesnt start with opening fence indent', () => {
    const text = '  ```\nline 1\nanother line\n  ```';
    const expected = 'line 1\nanother line'; // Fences removed, but no lines matched '  ' prefix
    expect(stripCodeFences(text)).toBe(expected);
  });

  it('should handle fences with language specifiers', () => {
    const text = '```javascript\nconst x = 1;\n```';
    expect(stripCodeFences(text)).toBe('const x = 1;');
  });

  it('should handle indented fences with language specifiers', () => {
    const text = '  ```typescript\n  const y: string = "hello";\n  ```';
    expect(stripCodeFences(text)).toBe('const y: string = "hello";');
  });

  it('should handle trailing newline after closing fence', () => {
    const text = '```\ncontent\n```\n';
    expect(stripCodeFences(text)).toBe('content');
  });

  it('should handle leading newline before opening fence', () => {
    const text = '\n```\ncontent\n```';
    expect(stripCodeFences(text)).toBe('\n```\ncontent');
  });
});
