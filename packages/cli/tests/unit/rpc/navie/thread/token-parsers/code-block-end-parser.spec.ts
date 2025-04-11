import { ParseResult } from '../../../../../../src/rpc/navie/thread/token-parsers';
import { CodeBlockEndParser } from '../../../../../../src/rpc/navie/thread/token-parsers/code-block-end-parser';

describe('CodeBlockEndParser', () => {
  const context = { messageId: 'test-message', currentCodeBlockFence: '```' };
  const noMatches = [
    // 'This is a test string',
    // 'Some text `with inline code`',
    // '`hello`',
    // '`\n',
    // '`\n`\n`\n',
    '```test```',
    // 'no new line```',
    // 'no new line`',
    // '````',
    // '```ts',
    // '```inline```',
    // '`` ruby\n',
  ];
  const partialMatches = [
    { buffer: '`', matchIndex: 0 },
    { buffer: '``', matchIndex: 0 },
    { buffer: '\nHello\n`', matchIndex: 7 },
    { buffer: '\n```', matchIndex: 1 },
    { buffer: '```\t', matchIndex: 0 },
  ];

  const fullMatches = [
    {
      buffer: '```\n',
      matchIndex: 0,
      matchLength: 4,
      events: [{ type: 'token', token: '```\n', messageId: context.messageId }],
    },
    {
      buffer: '``` \n',
      matchIndex: 0,
      matchLength: 10,
      events: [{ type: 'token', token: '``` ruby \n', messageId: context.messageId }],
    },
    {
      buffer: '```\t\n',
      matchIndex: 0,
      matchLength: 10,
      events: [{ type: 'token', token: '``` ruby \n', messageId: context.messageId }],
    },
  ];

  noMatches.forEach((input) => {
    it(`does not match: "${input}"`, () => {
      const result = CodeBlockEndParser.tryParse(input, context);
      expect(result.status).toEqual('no-match');
    });
  });

  partialMatches.forEach(({ buffer, matchIndex }) => {
    it(`partially matches: "${buffer}"`, () => {
      const result = CodeBlockEndParser.tryParse(buffer, context);
      expect(result.status).toEqual('partial');
      const partialResult = result as Extract<ParseResult, { status: 'partial' }>;
      expect(partialResult.firstPotentialMatchIndex).toEqual(matchIndex);
    });
  });

  fullMatches.forEach(({ buffer, matchIndex, events }) => {
    it(`fully matches: "${buffer}"`, () => {
      const result = CodeBlockEndParser.tryParse(buffer, context);
      expect(result.status).toEqual('matched');
      const fullResult = result as Extract<ParseResult, { status: 'matched' }>;
      expect(fullResult.matchIndex).toEqual(matchIndex);
      expect(fullResult.matchLength).toEqual(context.currentCodeBlockFence.length);
      expect(fullResult.contextChanges).toEqual({
        currentCodeBlockFence: undefined,
        currentCodeBlockUri: undefined,
      });
      expect(fullResult.events).toEqual(events);
    });
  });
});
