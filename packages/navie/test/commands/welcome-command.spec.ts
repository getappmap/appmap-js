/*
  eslint
  @typescript-eslint/unbound-method: 0,
  @typescript-eslint/no-unsafe-assignment: 0,
  @typescript-eslint/no-explicit-any: 0,
  func-names: 0
*/

import { UserContext, UserOptions } from '../../src';
import WelcomeCommand, { WelcomeSummary } from '../../src/commands/welcome-command';
import CompletionService from '../../src/services/completion-service';

describe('WelcomeCommand', () => {
  let command: WelcomeCommand;
  let completionService: CompletionService;
  const codeSelection: UserContext.CodeSelectionItem[] = [
    {
      type: 'code-selection',
      content: '- this\n+ that',
    },
  ];
  const sanitizedActivity = 'working on something';
  const exampleWelcomeMessage = {
    activity: `${sanitizedActivity}.!?`,
    suggestions: ['@explain this', '@diagram that'],
  };
  const read = async (input: AsyncIterable<string>) => {
    let result = '';
    for await (const item of input) {
      result += item;
    }
    return result;
  };

  beforeEach(() => {
    completionService = {
      json: jest.fn().mockResolvedValue(exampleWelcomeMessage),
      modelName: 'exampleModel',
    } as any;
    command = new WelcomeCommand(completionService);
  });

  afterEach(jest.resetAllMocks);

  it('yields nothing without a code selection', async () => {
    const result = await read(
      command.execute({ question: '@welcome', userOptions: new UserOptions(new Map()) })
    );

    expect(result).toEqual('');
    expect(completionService.json).not.toHaveBeenCalled();
  });

  it('yields nothing if the welcome message fails generation', async () => {
    completionService.json = jest.fn().mockResolvedValue(undefined);
    const result = await read(
      command.execute({
        question: '@welcome',
        userOptions: new UserOptions(new Map()),
        codeSelection,
      })
    );

    expect(result).toEqual('');
    expect(completionService.json).toHaveBeenCalledTimes(1);
  });

  it('includes the code selection in the user prompt', async () => {
    await read(
      command.execute({
        question: '@welcome',
        userOptions: new UserOptions(new Map()),
        codeSelection,
      })
    );
    expect(completionService.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        {
          role: 'user',
          content: expect.stringContaining(codeSelection[0].content),
        },
      ]),
      expect.anything(),
      expect.anything()
    );
  });

  it('removes trailing punctuation from the activity', async () => {
    const result = await read(
      command.execute({
        question: '@welcome',
        userOptions: new UserOptions(new Map()),
        codeSelection,
      })
    );

    const welcomeSummary = JSON.parse(result) as unknown as { activity: string };
    expect(welcomeSummary.activity).toEqual(sanitizedActivity);
  });

  it('returns the expected serialized welcome message', async () => {
    const result = await read(
      command.execute({
        question: '@welcome',
        userOptions: new UserOptions(new Map()),
        codeSelection,
      })
    );

    // This will raise an exception if it fails.
    const welcomeSummary = WelcomeSummary.parse(JSON.parse(result));
    expect(welcomeSummary.suggestions).toEqual(['@explain this', '@diagram that']);
  });
});
