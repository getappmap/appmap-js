import ExplainCommand from '../src/commands/explain-command';
import { ContextV2 } from '../src/context';
import { HelpProvider } from '../src/help';
import { ClientRequest, NavieOptions, default as navie } from '../src/navie';
import { ProjectInfoProvider } from '../src/project-info';
import { TestInvocationProvider } from '../src/test-invocation';

describe('Navie Function', () => {
  let clientRequest: ClientRequest;
  let contextProvider: ContextV2.ContextProvider;
  let projectInfoProvider: ProjectInfoProvider;
  let helpProvider: HelpProvider;
  let testInvocationProvider: TestInvocationProvider;
  let options: NavieOptions;

  beforeEach(() => {
    clientRequest = { question: '' };
    contextProvider = jest.fn().mockResolvedValue({});
    projectInfoProvider = jest.fn().mockResolvedValue({});
    helpProvider = jest.fn().mockResolvedValue({});
    testInvocationProvider = jest.fn().mockResolvedValue({});
    options = new NavieOptions();
  });

  test('uses default command if question is empty', async () => {
    const instance = navie(
      clientRequest,
      contextProvider,
      projectInfoProvider,
      helpProvider,
      testInvocationProvider,
      options
    );
    const result = [];
    for await (const chunk of instance.execute()) {
      result.push(chunk);
    }
    expect(result).toBeTruthy();
    expect(clientRequest.question).toEqual('explain');
  });
});

jest.mock('../src/commands/explain-command');
// eslint-disable-next-line @typescript-eslint/require-await
ExplainCommand.prototype.execute = jest.fn().mockImplementation(async function* () {
  yield 'This is a test response';
});

jest.mock('../src/services/openai-completion-service');
