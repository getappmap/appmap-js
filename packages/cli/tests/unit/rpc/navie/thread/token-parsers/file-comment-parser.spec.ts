import { NavieTokenMetadataEvent } from '../../../../../../src/rpc/navie/thread/events';
import { ParseResult } from '../../../../../../src/rpc/navie/thread/token-parsers';
import { FileCommentParser } from '../../../../../../src/rpc/navie/thread/token-parsers/file-comment-parser';

describe('FileCommentParser', () => {
  const noMatches = [
    'This is a test string',
    'Another line without the pattern',
    'Just some random text',
    '!-- file: -->',
    'file:',
    '-->',
    '<!-- hello world -->',
    '<!---',
  ];
  const partialMatches = [
    { buffer: '<!-- file: ', matchIndex: 0 },
    { buffer: '<!-- file: /path/to/file', matchIndex: 0 },
    { buffer: '<!-- file: /path/to/file --', matchIndex: 0 },
    { buffer: 'hello world <', matchIndex: 12 },
    { buffer: '<!<!--', matchIndex: 2 },
    { buffer: '<!-- <!-- file:', matchIndex: 5 },
    { buffer: '<!-- file: /path/to/file -->', matchIndex: 0 }, // No new line
  ];
  const fullMatches = [
    {
      buffer: '<!-- file: /path/to/file -->\n',
      matchIndex: 0,
      matchLength: 29,
      filePath: '/path/to/file',
    },
    {
      buffer: '<!-- file: C:\\Users\\Me\\My Documents -->\n',
      matchIndex: 0,
      matchLength: 40,
      filePath: 'C:\\Users\\Me\\My Documents',
    },
    {
      buffer: 'hello world\n<!-- file: /path/to/file -->\n',
      matchIndex: 12,
      matchLength: 29,
      filePath: '/path/to/file',
    },
    {
      buffer: 'hello world\n<!-- file:README.md -->\n```markdown\n',
      matchIndex: 12,
      matchLength: 24,
      filePath: 'README.md',
    },
  ];

  const context = { messageId: 'test-message' };

  noMatches.forEach((input) => {
    it(`does not match: "${input}"`, () => {
      const result = FileCommentParser.tryParse(input, context);
      expect(result.status).toBe('no-match');
    });
  });

  partialMatches.forEach(({ buffer, matchIndex }) => {
    it(`partially matches: "${buffer}"`, () => {
      const result = FileCommentParser.tryParse(buffer, context);
      expect(result.status).toBe('partial');
      const partialResult = result as Extract<ParseResult, { status: 'partial' }>;
      expect(partialResult.firstPotentialMatchIndex).toBe(matchIndex);
    });
  });

  fullMatches.forEach(({ buffer, matchIndex, filePath }) => {
    it(`fully matches: "${buffer}"`, () => {
      const result = FileCommentParser.tryParse(buffer, context);
      expect(result.status).toBe('matched');
      const fullResult = result as Extract<ParseResult, { status: 'matched' }>;
      expect(fullResult.events).toHaveLength(1);
      expect(fullResult.events[0].type).toBe('token-metadata');
      expect(fullResult.matchIndex).toBe(matchIndex);
      const event = fullResult.events[0] as Extract<
        NavieTokenMetadataEvent,
        { type: 'token-metadata' }
      >;
      expect(event.metadata.location).toBe(filePath);
    });
  });
});
