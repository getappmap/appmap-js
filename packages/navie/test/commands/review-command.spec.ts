/* eslint-disable @typescript-eslint/require-await */
/*
  eslint
  @typescript-eslint/unbound-method: 0,
  @typescript-eslint/no-unsafe-assignment: 0,
  @typescript-eslint/no-explicit-any: 0,
  func-names: 0
*/

import { Message } from '../../src';
import ReviewCommand from '../../src/commands/review-command';
import InteractionHistory from '../../src/interaction-history';
import { UserOptions } from '../../src/lib/parse-options';
import LookupContextService from '../../src/services/lookup-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import MockCompletionService from '../services/mock-completion-service';

describe('ReviewCommand', () => {
  let command: ReviewCommand;
  let completionService: MockCompletionService;
  let lookupContextService: LookupContextService;
  let interactionHistory: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContext: jest.Mock;
  const vectorTerms = ['test', 'terms'];
  const tokenLimit = 1000;
  const responseTokens = 1000;
  const exampleGeneration = 'example generation';
  const exampleContext = [
    {
      type: 'code-snippet',
      content: 'it("works", () => true);',
      location: 'test/assert_true.js',
    },
  ];
  const exampleSummaryObject = {
    reviewDomains: [
      {
        name: 'Correctness',
        reasoning: 'let me explain...',
        result: 'reject',
        comments: ['you forgot to add a semicolon'],
      },
      {
        name: 'Performance',
        reasoning: 'lgtm',
        result: 'accept',
        comments: ['great job'],
      },
    ],
  };
  const exampleSummaryMarkdown = `## ❌ Correctness
#### Summary
let me explain...
#### Recommended Actions
- you forgot to add a semicolon
## ✅ Performance
#### Summary
lgtm
#### Considerations
- great job
`;
  const read = async (input: AsyncIterable<string>) => {
    let result = '';
    for await (const item of input) {
      result += item;
    }
    return result;
  };

  beforeEach(() => {
    completionService = new MockCompletionService();
    completionService.mock(exampleGeneration);
    jest.spyOn(completionService, '_json').mockResolvedValue(exampleSummaryObject);
    interactionHistory = new InteractionHistory();
    lookupContext = jest.fn().mockResolvedValue(exampleContext);
    lookupContextService = new LookupContextService(
      interactionHistory,
      lookupContext,
      jest.fn().mockResolvedValue([])
    );
    vectorTermsService = {
      suggestTerms: jest.fn().mockResolvedValue(vectorTerms),
    } as any;
    command = new ReviewCommand(
      { tokenLimit, responseTokens },
      completionService,
      lookupContextService,
      vectorTermsService
    );
  });

  afterEach(jest.resetAllMocks);

  it('fails in an expected manner if no code selection is provided', async () => {
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
      })
    );

    expect(result).toStrictEqual('No code selection was provided.');
    expect(completionService.complete).not.toHaveBeenCalled();
    expect(lookupContext).not.toHaveBeenCalled();
  });

  it('fails in an expected manner if the code selection is the wrong type', async () => {
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
        codeSelection: 'i am running an old version of appmap',
      })
    );

    expect(result).toStrictEqual('No code selection was provided.');
    expect(completionService.complete).not.toHaveBeenCalled();
    expect(lookupContext).not.toHaveBeenCalled();
  });

  it('handles token limit exceeded errors with guidance', async () => {
    completionService.maxTokens = tokenLimit;
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content: 'large diff content'.repeat(100),
          },
        ],
      })
    );

    expect(result).toContain(`${tokenLimit.toLocaleString()} max`);
    expect(result).toContain('Breaking the review into smaller chunks');
    expect(result).toContain('Removing unnecessary context');
    expect(result).toContain('Using a model with a larger context window');
  });

  it('rethrows non-token-limit errors', async () => {
    const errorMessage = 'Some other API error';
    completionService.complete = jest.fn().mockImplementation(function* () {
      throw new Error(errorMessage);
    });

    await expect(
      read(
        command.execute({
          question: 'review',
          userOptions: new UserOptions(new Map()),
          codeSelection: [
            {
              type: 'code-snippet',
              location: 'git diff',
              content: 'diff content',
            },
          ],
        })
      )
    ).rejects.toThrow(errorMessage);
  });

  it('fails in an expected manner if the diff is empty', async () => {
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content: '',
          },
        ],
      })
    );

    expect(result).toEqual('The base is the same as the head. A review cannot be performed.');
    expect(completionService.complete).not.toHaveBeenCalled();
    expect(lookupContext).not.toHaveBeenCalled();
  });

  it('fails in an expected manner if the diff is not provided', async () => {
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
        codeSelection: [],
      })
    );

    expect(result).toEqual('Unable to obtain the diff for the current branch. Please try again.');
    expect(completionService.complete).not.toHaveBeenCalled();
    expect(lookupContext).not.toHaveBeenCalled();
  });

  it('does not include the user prompt if no additional criteria is provided', async () => {
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content: 'diff content',
          },
        ],
      })
    );

    const [firstArgument]: [Message[]] = (completionService.complete as jest.Mock).mock.calls[0];
    expect(result).toEqual(exampleSummaryMarkdown);
    expect(firstArgument[1]).not.toStrictEqual({
      role: 'user',
      content: expect.stringContaining('\nreview\n'),
    });
  });

  it('uses search terms from the question and the diff', async () => {
    const result = await read(
      command.execute({
        question: 'review security performance',
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content: 'diff content',
          },
        ],
      })
    );

    expect(result).toEqual(exampleSummaryMarkdown);
    expect(completionService.complete).toHaveBeenCalledTimes(1);
    expect(vectorTermsService.suggestTerms).toHaveBeenCalledWith(
      'diff content\nsecurity performance'
    );
    expect(lookupContext).toHaveBeenCalledWith({
      tokenCount: tokenLimit,
      type: 'search',
      version: 2,
      vectorTerms,
    });
  });

  it('yields the summary of the review', async () => {
    const completionOutput = 'hello from the completion service';
    completionService.complete = jest.fn().mockImplementation(function* () {
      yield completionOutput;
    });
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content: 'diff content',
          },
        ],
      })
    );

    const [messages]: [Message[]] = (completionService.json as jest.Mock).mock.calls[0];
    expect(result).toEqual(exampleSummaryMarkdown);
    expect(completionService.complete).toHaveBeenCalledTimes(1);
    expect(messages).toStrictEqual([
      {
        role: 'system',
        content: expect.stringContaining('You are an expert software engineer'),
      },
      {
        role: 'user',
        content: expect.stringContaining('Here is the diff:'),
      },
      {
        role: 'assistant',
        content: expect.stringContaining(completionOutput),
      },
      {
        role: 'user',
        content: expect.stringContaining('Now, using your analysis, summarize the review'),
      },
    ]);
    expect(lookupContext).toHaveBeenCalledTimes(1);
  });

  it('includes the question in the initial user prompt, if provided', async () => {
    const question = 'security issues and performance regressions';
    const result = await read(
      command.execute({
        question,
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content: 'diff content',
          },
        ],
      })
    );

    const [firstArgument]: [Message[]] = (completionService.complete as jest.Mock).mock.calls[0];

    expect(result).toEqual(exampleSummaryMarkdown);
    expect(firstArgument[1]).toStrictEqual({
      role: 'user',
      content: expect.stringContaining(question),
    });
  });

  it('includes context in the initial user prompt', async () => {
    const result = await read(
      command.execute({
        question: 'review for security issues',
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content: 'diff content',
          },
        ],
      })
    );

    const [firstArgument]: [Message[]] = (completionService.complete as jest.Mock).mock.calls[0];
    expect(result).toEqual(exampleSummaryMarkdown);
    expect(firstArgument[1]).toStrictEqual({
      role: 'user',
      content: expect.stringContaining(
        '<code-snippet location="test/assert_true.js">\nit("works", () => true);\n</code-snippet>'
      ),
    });
  });

  it('includes the code selections which have been sent without a location', async () => {
    const content = 'here is some review criteria';
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-selection',
            content,
          },
          {
            type: 'code-snippet',
            location: 'git diff',
            content: 'diff content',
          },
        ],
      })
    );

    const [firstArgument]: [Message[]] = (completionService.complete as jest.Mock).mock.calls[0];
    expect(result).toEqual(exampleSummaryMarkdown);
    expect(firstArgument[1]).toStrictEqual({
      role: 'user',
      content: expect.stringContaining(`<code-selection>\n${content}\n</code-selection>`),
    });
  });

  it('includes the diff in the initial user prompt', async () => {
    const content = 'truly unique diff content';
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map()),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content,
          },
        ],
      })
    );

    const [firstArgument]: [Message[]] = (completionService.complete as jest.Mock).mock.calls[0];
    expect(result).toEqual(exampleSummaryMarkdown);
    expect(firstArgument[1]).toStrictEqual({
      role: 'user',
      content: expect.stringContaining(content),
    });
  });

  it('yields the git diff and analysis when verbose=true', async () => {
    const result = await read(
      command.execute({
        question: 'review',
        userOptions: new UserOptions(new Map([['verbose', true]])),
        codeSelection: [
          {
            type: 'code-snippet',
            location: 'git diff',
            content: 'diff content',
          },
        ],
      })
    );

    expect(result).toStrictEqual(`\`\`\`diff
diff content
\`\`\`
${exampleGeneration}
${exampleSummaryMarkdown}`);
  });
});
