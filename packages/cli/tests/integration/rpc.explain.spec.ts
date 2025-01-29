import assert from 'assert';
import { ExplainRpc } from '@appland/rpc';
import { ContextV2, ProjectInfo, Help, navie, applyContext, Navie } from '@appland/navie';
import { AI, AIClient, AICallbacks, AIInputPromptOptions, AIUserInput } from '@appland/client';

import { waitFor } from './waitFor';
import { DEFAULT_WORKING_DIR, default as RPCTest, SingleDirectoryRPCTest } from './RPCTest';
import RemoteNavie from '../../src/rpc/explain/navie/navie-remote';
import LocalNavie from '../../src/rpc/explain/navie/navie-local';
import { INavieProvider } from '../../src/rpc/explain/navie/inavie';

import Telemetry, { Git } from '../../src/telemetry';
import { verbose } from '../../src/utils';

jest.mock('@appland/navie');

if (process.env.VERBOSE === 'true') verbose(true);

describe('RPC', () => {
  const enrollmentDate = new Date();

  describe('explain', () => {
    let navieProvider: INavieProvider;
    let rpcTest: RPCTest;

    const question = 'How is the API key verified?';
    const answer = `A useful explanation of API key verification`;

    const queryStatusWithArgs = async (
      userMessageId: string,
      threadId: string
    ): Promise<ExplainRpc.ExplainStatusResponse> => {
      const statusOptions: ExplainRpc.ExplainStatusOptions = {
        userMessageId,
        threadId,
      };
      const statusResponse = await rpcTest.client.request(
        ExplainRpc.ExplainStatusFunctionName,
        statusOptions
      );
      expect(statusResponse.error).toBeFalsy();
      const statusResult: ExplainRpc.ExplainStatusResponse = statusResponse.result;
      return statusResult;
    };

    describe('via local AI service', () => {
      beforeAll(() => {
        navieProvider = (
          contextProvider: ContextV2.ContextProvider,
          projectInfoProvider: ProjectInfo.ProjectInfoProvider,
          helpProvider: Help.HelpProvider
        ) => new LocalNavie(contextProvider, projectInfoProvider, helpProvider);
        rpcTest = new SingleDirectoryRPCTest(DEFAULT_WORKING_DIR, navieProvider);
      });

      beforeAll(async () => await rpcTest.setupAll());
      beforeEach(async () => await rpcTest.setupEach());
      afterEach(async () => await rpcTest.teardownEach());
      afterAll(async () => await rpcTest.teardownAll());

      it('answers the question', async () => {
        jest.spyOn(Telemetry, 'enabled', 'get').mockReturnValue(true);
        const navieImpl = {
          on(_event: any, _listener: any) {},
          execute(): AsyncIterable<string> {
            return (async function* () {
              yield answer;
            })();
          },
        };

        jest.mocked(navie).mockReturnValue(navieImpl);
        jest
          .mocked(applyContext)
          .mockImplementation((context: ContextV2.ContextResponse) => context);

        const explainOptions: ExplainRpc.ExplainOptions = {
          question,
        };
        const response = await rpcTest.client.request(
          ExplainRpc.ExplainFunctionName,
          explainOptions
        );
        expect(response.error).toBeFalsy();

        const explainResponse: ExplainRpc.ExplainResponse = response.result;
        expect(explainResponse.userMessageId).toBeTruthy();
        expect(explainResponse.threadId).toBeTruthy();

        const queryStatus = queryStatusWithArgs.bind(
          null,
          explainResponse.userMessageId,
          explainResponse.threadId
        );

        await waitFor(async () => (await queryStatus()).step === ExplainRpc.Step.COMPLETE);
        const statusResult = await queryStatus();
        expect(statusResult.explanation).toEqual([answer]);
        expect(Telemetry.sendEvent).toBeCalledWith({
          name: 'navie-local',
          properties: { modelName: 'test-model' },
        });
      });
    });
  });
});

jest.mock('../../src/telemetry');
Object.defineProperty(Telemetry, 'enabled', { get: jest.fn(), configurable: true });
jest.mocked(Git.state).mockResolvedValue(0);
jest.mocked(Navie.NavieOptions).mockReturnValue({
  modelName: 'test-model',
  responseTokens: 42,
  temperature: 0.69,
  tokenLimit: 31337,
});
