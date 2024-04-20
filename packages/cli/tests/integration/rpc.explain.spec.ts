import assert from 'assert';
import { ExplainRpc } from '@appland/rpc';
import { Help, explain, applyContext, Explain } from '@appland/navie';
import { AI } from '@appland/client';
import { AIClient, AICallbacks, AIInputPromptOptions, AIUserInput } from '@appland/client';
import { ContextV2, InteractionHistory, ProjectInfo } from '@appland/navie';

import { waitFor } from './waitFor';
import { DEFAULT_WORKING_DIR, default as RPCTest, SingleDirectoryRPCTest } from './RPCTest';
import RemoteNavie from '../../src/rpc/explain/navie/navie-remote';
import LocalNavie from '../../src/rpc/explain/navie/navie-local';
import { INavieProvider } from '../../src/rpc/explain/navie/inavie';

import Telemetry from '../../src/telemetry';

jest.mock('@appland/navie');

describe('RPC', () => {
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
          threadId: string | undefined,
          contextProvider: ContextV2.ContextProvider,
          projectInfoProvider: ProjectInfo.ProjectInfoProvider,
          helpProvider: Help.HelpProvider
        ) => new LocalNavie(threadId, contextProvider, projectInfoProvider, helpProvider);
        rpcTest = new SingleDirectoryRPCTest(DEFAULT_WORKING_DIR, navieProvider);
      });

      beforeAll(async () => await rpcTest.setupAll());
      beforeEach(async () => await rpcTest.setupEach());
      afterEach(async () => await rpcTest.teardownEach());
      afterAll(async () => await rpcTest.teardownAll());

      it('answers the question', async () => {
        jest.spyOn(Telemetry, 'enabled', 'get').mockReturnValue(true);
        const explainImpl = {
          on(_event: 'event', _listener: (event: InteractionHistory.InteractionEvent) => void) {},
          execute(): AsyncIterable<string> {
            return (async function* () {
              yield answer;
            })();
          },
        };

        jest.mocked(explain).mockReturnValue(explainImpl);
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

    describe('via remote AI service', () => {
      beforeAll(() => {
        navieProvider = (
          threadId: string | undefined,
          contextProvider: ContextV2.ContextProvider,
          projectInfoProvider: ProjectInfo.ProjectInfoProvider,
          helpProvider: Help.HelpProvider
        ) => new RemoteNavie(threadId, contextProvider, projectInfoProvider, helpProvider);
        rpcTest = new SingleDirectoryRPCTest(DEFAULT_WORKING_DIR, navieProvider);
      });

      beforeAll(async () => await rpcTest.setupAll());
      beforeEach(async () => await rpcTest.setupEach());
      afterEach(async () => await rpcTest.teardownEach());
      afterAll(async () => await rpcTest.teardownAll());

      const threadId = 'the-thread-id';
      const userMessageId = 'the-user-message-id';

      it(
        'answers the question',
        async () => {
          class MockAIClient {
            constructor(public callbacks: AICallbacks) {}

            async inputPrompt(
              input: string | AIUserInput,
              options?: AIInputPromptOptions
            ): Promise<void> {
              expect(input).toEqual({ question, codeSelection: undefined });
              expect(options?.tool).toEqual('explain');
              this.callbacks.onAck!(userMessageId, threadId);

              const searchContextOptions: ContextV2.ContextRequest = {
                vectorTerms: ['api', 'key'],
                tokenCount: 4000,
              };

              const context: ContextV2.ContextResponse = (await this.callbacks.onRequestContext!({
                ...{ type: 'search', version: 2 },
                ...searchContextOptions,
              })) as ContextV2.ContextResponse;

              const itemTypes = ['code-snippet', 'data-request', 'sequence-diagram'];
              const contextItemTypes = context?.map((item) => item.type);
              const foundType = contextItemTypes.find((itemType) => itemTypes.includes(itemType));
              assert(foundType, `Expected one of ${itemTypes.join(', ')}, got none`);

              this.callbacks.onToken(answer, userMessageId);

              setTimeout(() => {
                this.callbacks.onComplete();
              }, 0);
            }
          }

          const aiClient = (callbacks: AICallbacks): AIClient => {
            return new MockAIClient(callbacks) as unknown as AIClient;
          };

          jest
            .spyOn(AI, 'connect')
            .mockImplementation((callbacks: AICallbacks) => Promise.resolve(aiClient(callbacks)));

          const explainOptions: ExplainRpc.ExplainOptions = {
            question,
          };
          const response = await rpcTest.client.request(
            ExplainRpc.ExplainFunctionName,
            explainOptions
          );
          expect(response.error).toBeFalsy();

          const explainResponse: ExplainRpc.ExplainResponse = response.result;
          expect(explainResponse.userMessageId).toEqual(userMessageId);

          const queryStatus = queryStatusWithArgs.bind(
            null,
            explainResponse.userMessageId,
            explainResponse.threadId
          );

          await waitFor(async () => (await queryStatus()).step === ExplainRpc.Step.COMPLETE);

          const statusResult: ExplainRpc.ExplainStatusResponse = await queryStatus();
          const sequenceDiagrams = statusResult.contextResponse
            ?.filter((item) => item.type === ContextV2.ContextItemType.SequenceDiagram)
            .map((item) => item.content);
          expect(sequenceDiagrams?.join('\n')).toContain('@startuml');
          expect(Object.keys(statusResult)).toContain('contextResponse');
          expect(Object.keys(statusResult)).toContain('searchResponse');
          expect(statusResult.searchResponse?.numResults).toBeTruthy();

          for (const key of ['contextResponse', 'searchResponse']) delete statusResult[key];

          expect(statusResult).toEqual({
            step: ExplainRpc.Step.COMPLETE,
            threadId,
            vectorTerms: ['api', 'key'],
            explanation: [answer],
          });
        },
        1000 * 10 // Allow this test to run a bit longer
      );

      describe('when a connection error occurs', () => {
        it('is propagated as code 500', async () => {
          jest.spyOn(AI, 'connect').mockImplementation(() => {
            throw new Error(`Connection failed`);
          });

          const explainOptions: ExplainRpc.ExplainOptions = {
            question,
          };
          const response = await rpcTest.client.request(
            ExplainRpc.ExplainFunctionName,
            explainOptions
          );
          expect(response.error).toBeTruthy();
          expect(response.error).toEqual({ code: 500, message: 'Connection failed' });
        });
      });

      describe('when the connection is terminated before ack', () => {
        it('resolves the handler', async () => {
          class MockAIClient {
            constructor(public callbacks: AICallbacks) {}

            async inputPrompt(): Promise<void> {
              this.callbacks.onComplete();
            }
          }

          const aiClient = (callbacks: AICallbacks): AIClient => {
            return new MockAIClient(callbacks) as unknown as AIClient;
          };

          jest
            .spyOn(AI, 'connect')
            .mockImplementation((callbacks: AICallbacks) => Promise.resolve(aiClient(callbacks)));

          const explainOptions: ExplainRpc.ExplainOptions = {
            question,
          };
          const response = await rpcTest.client.request(
            ExplainRpc.ExplainFunctionName,
            explainOptions
          );
          expect(response.error).toStrictEqual({
            code: 500,
            message: 'The response completed unexpectedly',
          });
        });
      });

      describe('when an error occurs before ack', () => {
        it('is propagated as code 500', async () => {
          class MockAIClient {
            constructor(public callbacks: AICallbacks, public error: string) {}

            async inputPrompt(): Promise<void> {
              setTimeout(() => {
                this.callbacks.onError!(new Error(this.error));
              }, 0);
            }
          }

          const aiClient = (callbacks: AICallbacks): AIClient => {
            return new MockAIClient(callbacks, 'Missing authentication') as unknown as AIClient;
          };

          jest
            .spyOn(AI, 'connect')
            .mockImplementation((callbacks: AICallbacks) => Promise.resolve(aiClient(callbacks)));

          const explainOptions: ExplainRpc.ExplainOptions = {
            question,
          };
          const response = await rpcTest.client.request(
            ExplainRpc.ExplainFunctionName,
            explainOptions
          );
          expect(response.error).toBeTruthy();
          expect(response.error).toEqual({
            message: 'Missing authentication',
            code: 500,
          });
        });
      });

      describe('when an error occurs after ack', () => {
        it('is propagated as code 500', async () => {
          class MockAIClient {
            constructor(public callbacks: AICallbacks, public error: string) {}

            async inputPrompt(): Promise<void> {
              this.callbacks.onAck!(userMessageId, threadId);

              setTimeout(() => {
                this.callbacks.onError!(new Error(this.error));
              }, 0);
            }
          }

          const aiClient = (callbacks: AICallbacks): AIClient => {
            return new MockAIClient(callbacks, 'GPT service unavailable') as unknown as AIClient;
          };

          jest
            .spyOn(AI, 'connect')
            .mockImplementation((callbacks: AICallbacks) => Promise.resolve(aiClient(callbacks)));

          const explainOptions: ExplainRpc.ExplainOptions = {
            question,
          };
          const response = await rpcTest.client.request(
            ExplainRpc.ExplainFunctionName,
            explainOptions
          );
          expect(response.error).toBeFalsy();
          const explainResponse: ExplainRpc.ExplainResponse = response.result;

          const queryStatus = queryStatusWithArgs.bind(
            null,
            explainResponse.userMessageId,
            explainResponse.threadId
          );

          await waitFor(async () => (await queryStatus()).step === ExplainRpc.Step.ERROR);
          const err: any = (await queryStatus()).err;

          assert(err);
          const { stack } = err;
          delete err.stack;
          expect(stack).toContain('Error: GPT service unavailable');
          expect(err).toEqual({
            message: 'GPT service unavailable',
            code: 500,
          });
        });
      });
    });
  });
});

jest.mock('../../src/telemetry');
Object.defineProperty(Telemetry, 'enabled', { get: jest.fn(), configurable: true });
jest.mocked(Explain.ExplainOptions).mockReturnValue({
  modelName: 'test-model',
  responseTokens: 42,
  temperature: 0.69,
  tokenLimit: 31337,
  agentMode: undefined,
});
