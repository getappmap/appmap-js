import FixCommand from '../../src/commands/fix-command';
import type ExplainCommand from '../../src/commands/explain-command';
import type { CommandRequest } from '../../src/command';
import type Message from '../../src/message';
import type { UserOptions } from '../../src/lib/parse-options';

describe('FixCommand', () => {
  let explainCommand: jest.Mocked<ExplainCommand>;
  let fixCommand: FixCommand;

  beforeEach(() => {
    explainCommand = {
      execute: jest.fn().mockImplementation(async function* () {}),
    } as unknown as jest.Mocked<ExplainCommand>;
    fixCommand = new FixCommand(explainCommand);
  });

  it('should yield plan and generate steps in order', async () => {
    // Arrange
    const planResponse = 'Plan: Fix the bug';
    const generateResponse = '<change>Some code change</change>';
    // Mock explainCommand.execute to yield planResponse then generateResponse
    // eslint-disable-next-line @typescript-eslint/require-await
    explainCommand.execute.mockImplementation(async function* (request) {
      if (request.question.startsWith('@plan')) {
        yield planResponse;
      }
      if (request.question.startsWith('@generate')) {
        yield generateResponse;
      }
    });

    const request: CommandRequest = {
      question: 'Fix the bug in file.js',
      userOptions: {
        clone: () => ({
          has: () => false,
          set: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        }),
        has: () => false,
        set: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<UserOptions>,
    };

    const chatHistory: Message[] = [];

    // Act
    const result: string[] = [];
    for await (const chunk of fixCommand.execute(request, chatHistory)) {
      result.push(chunk);
    }

    // Assert
    expect(result).toEqual([
      expect.stringContaining('Analyzing the issue...'),
      planResponse,
      expect.stringContaining('Generating code...'),
      generateResponse,
    ]);
    expect(chatHistory[0].content).toContain('@plan');
    expect(chatHistory[1].content).toBe(planResponse);
    expect(chatHistory[2].content).toContain('@generate');
    expect(chatHistory[3].content).toBe(generateResponse);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(explainCommand.execute).toHaveBeenCalledTimes(2);
  });

  it('should set userOptions correctly', async () => {
    const userOptions = {
      clone: jest.fn().mockReturnValue({
        has: jest.fn().mockReturnValue(false),
        set: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
      }),
      has: jest.fn().mockReturnValue(false),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };
    const request: CommandRequest = {
      question: 'Fix something',
      userOptions: userOptions as unknown as jest.Mocked<UserOptions>,
    };
    fixCommand = new FixCommand(explainCommand);
    // Just run to ensure no errors
    await (async () => {
      for await (const _ of fixCommand.execute(request)) {
        break;
      }
    })();
    expect(userOptions.clone).toHaveBeenCalled();
  });
});
