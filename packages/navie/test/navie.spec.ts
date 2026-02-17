import { CommandMode } from '../src/command';
import ExplainCommand from '../src/commands/explain-command';
import { ClientRequest, NavieOptions, default as navie } from '../src/navie';

jest.mock('../src/commands/explain-command');
jest.mock('../src/services/openai-completion-service');

// eslint-disable-next-line @typescript-eslint/require-await
ExplainCommand.prototype.execute = jest.fn().mockImplementation(async function* () {
  yield 'This is a test response';
});

describe('Navie Function', () => {
  let clientRequest: ClientRequest;

  const createNavie = () => {
    const contextProvider = jest.fn().mockResolvedValue({});
    const projectInfoProvider = jest.fn().mockResolvedValue({});
    const helpProvider = jest.fn().mockResolvedValue({});
    const testInvocationProvider = jest.fn().mockResolvedValue({});
    const options = new NavieOptions();

    return navie(
      clientRequest,
      contextProvider,
      projectInfoProvider,
      helpProvider,
      testInvocationProvider,
      options
    );
  };

  beforeEach(() => {
    clientRequest = { question: '' };
  });

  describe('commandMode property', () => {
    test.each([
      ['empty question', '', CommandMode.Explain],
      ['no command prefix', 'How does this work?', CommandMode.Explain],
      ['only whitespace', '   ', CommandMode.Explain],
      ['@welcome prefix', '@welcome', CommandMode.Welcome],
      ['@suggest prefix with text', '@suggest What should I do next?', CommandMode.Suggest],
      ['@suggest prefix alone', '@suggest', CommandMode.Suggest],
      ['@review prefix', '@review Check this code', CommandMode.Review],
      [
        '@review prefix multiline',
        '@review\nCheck this implementation\nfor potential bugs',
        CommandMode.Review,
      ],
      ['@observe prefix', '@observe What changed?', CommandMode.Observe],
      ['@fix prefix', '@fix Resolve this issue', CommandMode.Fix],
      ['@context prefix', '@context Show me relevant files', CommandMode.Context],
    ])('should set commandMode correctly for %s', (description, question, expectedMode) => {
      clientRequest.question = question;
      const instance = createNavie();
      expect(instance.commandMode).toEqual(expectedMode);
    });
  });

  describe('execution', () => {
    test('executes successfully and normalizes empty question', async () => {
      clientRequest.question = '';
      const instance = createNavie();
      const result = [];
      for await (const chunk of instance.execute()) {
        result.push(chunk);
      }
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('This is a test response');
      expect(clientRequest.question).toBe('explain');
    });
  });
});
