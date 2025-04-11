import {
  ParseContext,
  processBuffer,
  TOKEN_PARSERS,
} from '../../../../../../src/rpc/navie/thread/token-parsers';

describe('processBuffer', () => {
  const messageId = 'test-message';
  const testCases = [
    { input: 'test', remainingBuffer: '', events: [{ type: 'token', token: 'test', messageId }] },
    {
      input: `This is implemented here:
<!-- file: example.rb -->
\`\`\`ruby
# This is a comment
puts "Hello, world!"
\`\`\`
I hope that clarifies things.`,

      remainingBuffer: '',
      events: [
        { type: 'token', token: 'This is implemented here:\n', messageId },
        {
          type: 'token-metadata',
          codeBlockUri: expect.any(String),
          metadata: { location: 'example.rb' },
        },
        {
          type: 'token-metadata',
          codeBlockUri: expect.any(String),
          metadata: { language: 'ruby' },
        },
        {
          type: 'token',
          token: '```ruby',
          codeBlockUri: expect.any(String),
          messageId,
        },
        {
          type: 'token',
          token: '# This is a comment\nputs "Hello, world!"\n```\nI hope that clarifies things.',
          messageId,
        },
      ],
    },
  ];

  testCases.forEach(({ input, remainingBuffer, events }) => {
    let emit: jest.Mock;
    let context: ParseContext;

    beforeEach(() => {
      emit = jest.fn();
      context = { messageId };
    });

    it(`corrently handles input "${input}"`, () => {
      const result = processBuffer(input, TOKEN_PARSERS, context, emit);
      expect(result).toBe(remainingBuffer);
      expect(emit.mock.calls.flat()).toEqual(events);
    });
  });
});
