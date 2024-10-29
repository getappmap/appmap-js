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
import CompletionService from '../../src/services/completion-service';
import LookupContextService from '../../src/services/lookup-context-service';

describe('ReviewCommand', () => {
  let command: ReviewCommand;
  let completionService: CompletionService;
  let lookupContextService: LookupContextService;
  let interactionHistory: InteractionHistory;
  let lookupContext: jest.Mock;
  const tokenLimit = 1000;
  const responseTokens = 1000;
  const modelName = 'exampleModel';
  const miniModelName = 'exampleMiniModel';
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
    completionService = {
      complete: jest.fn().mockImplementation(function* () {
        yield exampleGeneration;
      }),
      json: jest.fn().mockResolvedValue(exampleSummaryObject),
      modelName: modelName,
      miniModelName: miniModelName,
    } as any;
    interactionHistory = new InteractionHistory();
    lookupContext = jest.fn().mockResolvedValue(exampleContext);
    lookupContextService = new LookupContextService(
      interactionHistory,
      lookupContext,
      jest.fn().mockResolvedValue([])
    );
    command = new ReviewCommand(
      { tokenLimit, responseTokens },
      completionService,
      lookupContextService
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
    expect(lookupContext).toHaveBeenCalledWith({
      tokenCount: tokenLimit,
      type: 'search',
      vectorTerms: ['security performance', 'diff content'],
      version: 2,
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