/*
  eslint
  @typescript-eslint/unbound-method: 0,
  @typescript-eslint/no-unsafe-assignment: 0,
  @typescript-eslint/no-explicit-any: 0,
  func-names: 0
*/

import ObserveCommand from '../../src/commands/observe-command';
import InteractionHistory from '../../src/interaction-history';
import { UserOptions } from '../../src/lib/parse-options';
import CompletionService from '../../src/services/completion-service';
import LookupContextService from '../../src/services/lookup-context-service';
import ProjectInfoService from '../../src/services/project-info-service';
import VectorTermsService from '../../src/services/vector-terms-service';

interface ObserveCommandPrivate {
  getLanguageDirective(userOptions: UserOptions): Promise<string>;
}

describe('ObserveCommand', () => {
  let command: ObserveCommand;
  let completionService: CompletionService;
  let lookupContextService: LookupContextService;
  let vectorTermsService: VectorTermsService;
  let interactionHistory: InteractionHistory;
  let projectInfoService: ProjectInfoService;
  let suggestTerms: jest.Mock;
  const tokenLimit = 1000;
  const responseTokens = 1000;
  const modelName = 'exampleModel';
  const miniModelName = 'exampleMiniModel';
  const exampleGeneration = 'example generation';
  const exampleContext = [
    {
      type: 'code-snippet',
      content: 'it("works", () => true);',
      directory: '/home/user/projects/my-app',
      path: 'test/assert_true.js',
    },
  ];
  const exampleHelp = [
    {
      filePath: 'doc.md',
      from: 1,
      to: 23,
      content: 'example help content',
      score: 10,
    },
  ];
  const read = async (input: AsyncIterable<string>) => {
    let result = '';
    for await (const item of input) {
      result += item;
    }
    return result;
  };

  beforeEach(() => {
    completionService = {
      json: jest.fn().mockResolvedValue({}),
      complete: jest.fn().mockImplementation(function* () {
        yield exampleGeneration;
      }),
      modelName: modelName,
      miniModelName: miniModelName,
    } as any;
    interactionHistory = new InteractionHistory();
    lookupContextService = new LookupContextService(
      interactionHistory,
      jest.fn().mockResolvedValue(exampleContext),
      jest.fn().mockResolvedValue(exampleHelp)
    );
    suggestTerms = jest.fn().mockResolvedValue(['example']);
    vectorTermsService = { suggestTerms } as any;
    projectInfoService = new ProjectInfoService(
      interactionHistory,
      jest.fn().mockResolvedValue([{ directory: 'test', appmapConfig: { language: 'ruby' } }])
    );
    command = new ObserveCommand(
      { tokenLimit, responseTokens },
      completionService,
      lookupContextService,
      vectorTermsService,
      interactionHistory,
      projectInfoService
    );
  });

  afterEach(jest.resetAllMocks);

  it('requests help docs if a test is identified', async () => {
    completionService.json = jest
      .fn()
      .mockReturnValueOnce({ relevantTest: { name: 'true is true', path: 'spec/my_spec.rb' } });
    lookupContextService.lookupHelp = jest.fn().mockReturnValueOnce([]);
    const result = await read(
      command.execute({
        question: 'what?',
        userOptions: new UserOptions(new Map()),
      })
    );

    expect(result).toEqual(exampleGeneration);
    expect(vectorTermsService.suggestTerms).toBeCalledTimes(1);
    expect(completionService.json).toBeCalledTimes(1);
    expect(lookupContextService.lookupHelp).toBeCalledTimes(1);
  });

  it('suggests a test if no test is identified', async () => {
    lookupContextService.lookupContext = jest.fn().mockResolvedValue([]);
    completionService.json = jest.fn().mockReturnValueOnce({
      suggestedTest: 'Write a test for the observe command that handles missing tests',
      relevantTest: { language: 'javascript' },
    });
    completionService.complete = jest
      .fn()
      .mockImplementationOnce(function* () {
        yield '1. Create the following test:\n<generated-test-case />\n2. Run the test';
      })
      .mockImplementation(function* () {
        yield 'Generated test case code';
      });

    const result = await read(
      command.execute({
        question: 'what?',
        userOptions: new UserOptions(new Map()),
      })
    );
    expect(result).toMatchInlineSnapshot(`
      "1. Create the following test:

      Generated test case code

      2. Run the test"
    `);
    expect(completionService.complete).toHaveBeenCalledTimes(4);
  });

  it('exits early if the language is not supported', async () => {
    lookupContextService.lookupHelp = jest.fn();
    completionService.json = jest.fn().mockReturnValueOnce({
      relevantTest: {
        name: 'true is true',
        path: 'tests/assert_true.c',
        language: 'other',
      },
    });
    const result = await read(
      command.execute({
        question: 'what?',
        userOptions: new UserOptions(new Map([['language', 'unsupported']])),
      })
    );
    expect(result).toEqual(
      "I found a relevant test at `tests/assert_true.c`, but I'm unable to help you record it at this time. This language does not appear to be supported."
    );
    expect(lookupContextService.lookupHelp).not.toBeCalled();
    expect(completionService.complete).not.toBeCalled();
  });

  it('yields the expected interaction history', async () => {
    completionService.json = jest
      .fn()
      .mockReturnValueOnce({ relevantTest: { name: 'true is true', path: 'spec/my_spec.rb' } });
    const question = 'hello?';
    await read(command.execute({ question, userOptions: new UserOptions(new Map()) }));
    expect(interactionHistory.events.map((e) => ({ ...e }))).toEqual([
      /*
        VectorTermsService.suggestTerms is stubbed.
        It'd otherwise include a VectorTermsEvent here.
      */
      {
        type: 'contextLookup',
        context: exampleContext,
      },
      {
        type: 'prompt',
        name: 'relevantTest',
        role: 'system',
        prefix: undefined,
        content: expect.stringContaining('Given the following code snippets'),
      },
      {
        type: 'prompt',
        name: 'relevantTest',
        role: 'user',
        prefix: undefined,
        content: question,
      },
      {
        type: 'completion',
        model: miniModelName,
        temperature: 0,
      },
      {
        type: 'prompt',
        name: 'relevantTest',
        role: 'assistant',
        prefix: undefined,
        content: expect.stringContaining('true is true'),
      },
      {
        type: 'helpLookup',
        help: exampleHelp,
      },
      {
        type: 'prompt',
        name: 'observe',
        role: 'system',
        prefix: undefined,
        content: expect.stringContaining('You are Navie'),
      },
      {
        type: 'prompt',
        name: 'observe',
        role: 'user',
        prefix: undefined,
        content: expect.stringContaining(question),
      },
      {
        type: 'prompt',
        name: 'observe',
        role: 'assistant',
        prefix: undefined,
        content: expect.stringContaining('the most relevant test case is:'),
      },
      {
        type: 'prompt',
        name: 'observe',
        role: 'user',
        prefix: undefined,
        content: expect.stringContaining("Restate the information you've provided to me"),
      },
      {
        type: 'completion',
        model: modelName,
        temperature: 0,
      },
    ]);
  });

  describe('getLanguageDirective', () => {
    let privateCommand: ObserveCommandPrivate;
    beforeEach(() => {
      privateCommand = command as unknown as ObserveCommandPrivate;
    });

    it('returns a language directive', async () => {
      const userOptions = new UserOptions(new Map([['language', 'ruby']]));
      const result = await privateCommand.getLanguageDirective(userOptions);
      expect(result).toEqual('The language of the test must be ruby.');
    });

    it('returns an empty string if the language is not found', async () => {
      const userOptions = new UserOptions(new Map([['language', 'YAML']]));
      const result = await privateCommand.getLanguageDirective(userOptions);
      expect(result).toEqual('The language of the test must be YAML.');
    });

    it('returns ambiguous instructions if no config is provided and language is not set', async () => {
      projectInfoService.projectInfoProvider = jest.fn().mockResolvedValue([]);
      const userOptions = new UserOptions(new Map());
      const result = await privateCommand.getLanguageDirective(userOptions);
      expect(result).toEqual(
        'Ideally, the language of the test case should be Java, Ruby, Python, or JavaScript.'
      );
    });

    it('returns ambiguous instructions if a config does not have a language', async () => {
      projectInfoService.projectInfoProvider = jest.fn().mockResolvedValue([
        {
          directory: 'test',
          appmapConfig: { language: undefined },
        },
      ]);
      const userOptions = new UserOptions(new Map());
      const result = await privateCommand.getLanguageDirective(userOptions);
      expect(result).toEqual(
        'Ideally, the language of the test case should be Java, Ruby, Python, or JavaScript.'
      );
    });

    it('renders a markdown table if more than one project is found', async () => {
      projectInfoService.projectInfoProvider = jest.fn().mockResolvedValue([
        {
          directory: '/home/user/projects/my-app',
          appmapConfig: { language: 'ruby' },
        },
        {
          directory: '/home/user/projects/other-app',
          appmapConfig: { language: 'javascript' },
        },
      ]);
      const userOptions = new UserOptions(new Map());
      const result = await privateCommand.getLanguageDirective(userOptions);
      expect(result).toEqual(
        [
          'The language of the test must be one of the following, associated by project directory:',
          '| Directory | Language |',
          '| --- | --- |',
          '| /home/user/projects/my-app | ruby |',
          '| /home/user/projects/other-app | javascript |',
        ].join('\n')
      );
    });

    it('provides additional instructions if a language is unknown', async () => {
      projectInfoService.projectInfoProvider = jest.fn().mockResolvedValue([
        {
          directory: '/home/user/projects/my-app',
          appmapConfig: { language: undefined },
        },
        {
          directory: '/home/user/projects/other-app',
          appmapConfig: { language: 'javascript' },
        },
      ]);
      const userOptions = new UserOptions(new Map());
      const result = await privateCommand.getLanguageDirective(userOptions);
      expect(result).toEqual(
        [
          'The language of the test must be one of the following, associated by project directory:',
          '| Directory | Language |',
          '| --- | --- |',
          '| /home/user/projects/my-app | unknown |',
          '| /home/user/projects/other-app | javascript |',
          '',
          'If a language is flagged as "unknown", ideally the language of the test case should be Java, Ruby, Python, or JavaScript, but this is not guaranteed.',
        ].join('\n')
      );
    });
  });
});
