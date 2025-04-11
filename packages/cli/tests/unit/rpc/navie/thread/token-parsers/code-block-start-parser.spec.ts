import { ParseResult } from '../../../../../../src/rpc/navie/thread/token-parsers';
import { CodeBlockStartParser } from '../../../../../../src/rpc/navie/thread/token-parsers/code-block-start-parser';

describe('CodeBlockStartParser', () => {
  const context = { messageId: 'test-message' };
  const noMatches = [
    'This is a test string',
    'Some text `with inline code`',
    '`hello`',
    '`\n',
    '`\n`\n`\n',
    '```test```',
    'no new line```',
    'no new line`',
    '',
    '```inline```',
    '`` ruby\n',
  ];
  const partialMatches = [
    { buffer: '`', matchIndex: 0 },
    { buffer: '``', matchIndex: 0 },
    { buffer: '`````````', matchIndex: 0 },
    { buffer: '```ts', matchIndex: 0 },
    { buffer: '\nHello\n`', matchIndex: 7 },
    { buffer: '``` js', matchIndex: 0 },
    { buffer: '\n```', matchIndex: 1 },
    { buffer: '```ts\t', matchIndex: 0 },
    { buffer: '\n\n```ts', matchIndex: 2 },
  ];

  const fullMatches = [
    {
      buffer: '```\n',
      matchIndex: 0,
      matchLength: 4,
      fence: '```',
      events: [{ type: 'token', token: '```\n', messageId: context.messageId }],
    },
    {
      buffer: '````\n',
      matchIndex: 0,
      matchLength: 5,
      fence: '````',
      events: [{ type: 'token', token: '````\n', messageId: context.messageId }],
    },
    {
      buffer: '```ruby\n',
      matchIndex: 0,
      matchLength: 8,
      fence: '```',
      events: [
        { type: 'token-metadata', metadata: { language: 'ruby' } },
        { type: 'token', token: '```ruby\n', messageId: context.messageId },
      ],
    },
    {
      buffer: '```ruby \n',
      matchIndex: 0,
      matchLength: 9,
      fence: '```',
      events: [
        { type: 'token-metadata', metadata: { language: 'ruby' } },
        { type: 'token', token: '```ruby \n', messageId: context.messageId },
      ],
    },
    {
      buffer: '``` ruby \n',
      matchIndex: 0,
      matchLength: 10,
      fence: '```',
      events: [
        { type: 'token-metadata', metadata: { language: 'ruby' } },
        { type: 'token', token: '``` ruby \n', messageId: context.messageId },
      ],
    },
  ];

  noMatches.forEach((input) => {
    it(`does not match: "${input}"`, () => {
      const result = CodeBlockStartParser.tryParse(input, context);
      expect(result.status).toEqual('no-match');
    });
  });

  partialMatches.forEach(({ buffer, matchIndex }) => {
    it(`partially matches: "${buffer}"`, () => {
      const result = CodeBlockStartParser.tryParse(buffer, context);
      expect(result.status).toEqual('partial');
      const partialResult = result as Extract<ParseResult, { status: 'partial' }>;
      expect(partialResult.firstPotentialMatchIndex).toEqual(matchIndex);
    });
  });

  fullMatches.forEach(({ buffer, matchIndex, matchLength, fence, events }) => {
    it(`fully matches: "${buffer}"`, () => {
      const result = CodeBlockStartParser.tryParse(buffer, context);
      expect(result.status).toEqual('matched');
      const fullResult = result as Extract<ParseResult, { status: 'matched' }>;
      expect(fullResult.matchIndex).toEqual(matchIndex);
      expect(fullResult.matchLength).toEqual(matchLength);
      expect(fullResult.contextChanges).toEqual({
        currentCodeBlockFence: fence,
        currentCodeBlockUri: expect.any(String),
      });
      expect(fullResult.events).toEqual(events);
    });
  });
});
