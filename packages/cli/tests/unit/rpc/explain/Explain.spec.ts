/* eslint-disable prefer-const */
import { ExplainRpc } from '@appland/rpc';
import { AI, ConversationThread } from '@appland/client';

import * as Config from '../../../../src/rpc/configuration';
import * as LLMConfiguration from '../../../../src/rpc/llmConfiguration';
import * as AIEnvVar from '../../../../src/cmds/index/aiEnvVar';
import { AppMapDirectory } from '../../../../src/rpc/configuration';
import { Explain } from '../../../../src/rpc/explain/explain';
import INavie from '../../../../src/rpc/explain/navie/inavie';
import EventEmitter from 'events';

describe('Explain', () => {
  let explain: Explain;
  let appmapDirectories: AppMapDirectory[] = [
    {
      directory: 'the-appmap-directory',
      appmapConfig: {
        name: 'the-appmap-config-name',
        language: 'java',
        packages: [{ path: 'org.example.package1' }],
      },
    },
  ];
  let projectDirectories = ['the-project-directory'];
  let question = 'What is the meaning of life?';
  let codeSelection: string | undefined;
  let appmaps: string[] | undefined;
  let status: ExplainRpc.ExplainStatusResponse;
  let codeEditor: string | undefined;

  beforeEach(() => {
    status = {
      step: ExplainRpc.Step.NEW,
    };
    explain = new Explain(
      appmapDirectories,
      projectDirectories,
      question,
      codeSelection,
      appmaps,
      status,
      codeEditor
    );
  });

  describe('enrollConversationThread', () => {
    const navie = {
      providerName: 'custom',
    } as unknown as INavie;

    describe('with minimal options', () => {
      it('collects the conversation metadata', async () => {
        jest.spyOn(Config, 'default').mockReturnValue({
          appmapDirectories: jest.fn().mockResolvedValue([]),
        } as unknown as Config.Configuration);
        jest.spyOn(LLMConfiguration, 'getLLMConfiguration').mockReturnValue({});

        jest.spyOn(AI, 'createConversationThread').mockResolvedValue({
          id: 'the-conversation-thread-id',
          permissions: { useNavieAIProxy: true },
          usage: { conversationCounts: [] },
        });

        jest.spyOn(AIEnvVar, 'default').mockReturnValue(undefined);

        await explain.enrollConversationThread(navie);

        expect(AI.createConversationThread).toHaveBeenCalledWith({
          modelParameters: {
            provider: 'custom',
          },
          projectParameters: {
            directoryCount: 0,
            directories: [],
          },
        });
      });
    });

    describe('with many options', () => {
      it('collects the conversation metadata', async () => {
        jest.spyOn(Config, 'default').mockReturnValue({
          appmapDirectories: jest.fn().mockResolvedValue([
            {
              directory: 'the-appmap-directory',
              appmapConfig: {
                name: 'the-appmap-config-name',
                language: 'java',
                packages: [{ path: 'org.example.package1' }],
              },
            },
          ]),
        } as unknown as Config.Configuration);
        jest.spyOn(LLMConfiguration, 'getLLMConfiguration').mockReturnValue({
          baseUrl: 'the-base-url',
          model: 'the-model',
        });

        jest.spyOn(AI, 'createConversationThread').mockResolvedValue({
          id: 'the-conversation-thread-id',
          permissions: { useNavieAIProxy: true },
          usage: { conversationCounts: [] },
        });

        jest.spyOn(AIEnvVar, 'default').mockReturnValue('THE_AI_KEY');

        await explain.enrollConversationThread(navie);

        expect(AI.createConversationThread).toHaveBeenCalledWith({
          modelParameters: {
            aiKeyName: 'THE_AI_KEY',
            baseUrl: 'the-base-url',
            model: 'the-model',
            provider: 'custom',
          },
          projectParameters: {
            directoryCount: 1,
            directories: [
              {
                hasAppMapConfig: true,
                language: 'java',
              },
            ],
          },
        });
      });
    });
  });

  describe('explain', () => {
    describe('when conversation enrollment succeeds', () => {
      let conversationThread: ConversationThread;

      beforeEach(() => {
        conversationThread = {
          id: 'the-conversation-thread-id',
          permissions: { useNavieAIProxy: true },
          usage: { conversationCounts: [] },
        };
        jest.spyOn(explain, 'enrollConversationThread').mockResolvedValue(conversationThread);
      });

      it('the thread id is utilized', async () => {
        const navie = {
          ask: jest.fn().mockResolvedValue('the-answer'),
          on: jest.fn(),
        } as unknown as INavie;
        await explain.explain(navie);

        expect(explain.conversationThread).toEqual(conversationThread);
        expect(status).toEqual({ step: ExplainRpc.Step.NEW, threadId: conversationThread.id });
      });
    });

    describe('when conversation enrollment fails', () => {
      beforeEach(() => {
        jest.spyOn(explain, 'enrollConversationThread').mockResolvedValue(undefined);
      });

      it('the thread id is not utilized', async () => {
        const navie = {
          ask: jest.fn().mockResolvedValue('the-answer'),
          on: jest.fn(),
        } as unknown as INavie;
        await explain.explain(navie);

        expect(explain.conversationThread).toBeUndefined();
        expect(status).toEqual({ step: ExplainRpc.Step.NEW });
        expect(navie.ask).toHaveBeenCalledWith(undefined, question, undefined, undefined);
      });

      describe('and navie acks the message', () => {
        it('the thread id is obtained', async () => {
          const navie = new EventEmitter() as any;
          navie.ask = jest.fn().mockImplementation((threadId, question, codeSelection) => {
            expect(threadId).toBeUndefined();
            expect(question).toEqual('What is the meaning of life?');
            expect(codeSelection).toBeUndefined();

            navie.emit('ack', 'the-user-message-id', 'the-thread-id');
          });
          await new Promise<void>((resolve) => {
            explain.addListener('ack', (userMessageId, threadId) => {
              expect(userMessageId).toEqual('the-user-message-id');
              expect(threadId).toEqual('the-thread-id');
              expect(status).toEqual({ step: ExplainRpc.Step.NEW, threadId: 'the-thread-id' });

              resolve();
            });
            explain.explain(navie as INavie);
          });
        });
      });
    });
  });
});
