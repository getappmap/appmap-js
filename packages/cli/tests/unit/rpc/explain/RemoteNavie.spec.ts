import { ContextV1, ContextV2 } from '@appland/navie';
import RemoteNavie from '../../../../src/rpc/explain/navie/navie-remote';
import { AI, AIClient, AICallbacks } from '@appland/client';

jest.mock('@appland/client');

describe('RemoteNavie', () => {
  let navie: RemoteNavie;
  let contextProvider = jest.fn();
  let projectInfoProvider = jest.fn();
  let helpProvider = jest.fn();
  let callbacks: AICallbacks;
  let aiClient: AIClient;
  let inputPrompt = jest.fn();
  const question = 'What is the meaning of life?';
  let codeSelection: string | undefined;

  beforeEach(() => {
    navie = new RemoteNavie('threadId', contextProvider, projectInfoProvider, helpProvider);

    aiClient = {
      inputPrompt,
    } as unknown as AIClient;

    jest.mocked(AI.connect).mockImplementation((callbacksArg) => {
      callbacks = callbacksArg;
      return Promise.resolve(aiClient);
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('ask', () => {
    const vectorTerms = ['meaning', 'life'];
    const tokenCount = 1000;

    let ackFn: jest.Mock;
    let tokenFn: jest.Mock;
    let completeFn: jest.Mock;
    let errorFn: jest.Mock;

    beforeEach(() => {
      ackFn = jest.fn();
      tokenFn = jest.fn();
      completeFn = jest.fn();
      errorFn = jest.fn();

      navie.on('ack', ackFn);
      navie.on('token', tokenFn);
      navie.on('complete', completeFn);
      navie.on('error', errorFn);

      contextProvider.mockResolvedValue([
        {
          location: 'app/user.rb',
          type: ContextV2.ContextItemType.CodeSnippet,
          content: `class User < ApplicationRecord; end`,
        },
        {
          content: 'diagram-1',
          type: ContextV2.ContextItemType.SequenceDiagram,
        },
        {
          content: 'SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT 1',
          type: ContextV2.ContextItemType.DataRequest,
        },
      ]);
    });

    it('provides ContextV2', async () => {
      await navie.ask(question, codeSelection);

      callbacks.onAck!('userMessageId', 'threadId');
      expect(ackFn).toHaveBeenCalledWith('userMessageId', 'threadId');

      const contextRequestV2: ContextV2.ContextRequest = {
        vectorTerms,
        tokenCount,
      };

      const contextObj = await callbacks.onRequestContext!({
        ...{
          type: 'search',
          version: 2,
        },
        ...contextRequestV2,
      });

      const context: ContextV2.ContextResponse = contextObj as ContextV2.ContextResponse;

      expect(context).toEqual([
        {
          location: 'app/user.rb',
          type: ContextV2.ContextItemType.CodeSnippet,
          content: `class User < ApplicationRecord; end`,
        },
        {
          content: 'diagram-1',
          type: ContextV2.ContextItemType.SequenceDiagram,
        },
        {
          content: 'SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT 1',
          type: ContextV2.ContextItemType.DataRequest,
        },
      ]);
    });

    it('adapts ContextV1 to ContextV2', async () => {
      await navie.ask(question, codeSelection);

      callbacks.onAck!('userMessageId', 'threadId');
      expect(ackFn).toHaveBeenCalledWith('userMessageId', 'threadId');

      const contextRequestV1: ContextV1.ContextRequest = {
        vectorTerms,
        tokenCount,
      };
      const context: ContextV1.ContextResponse = (await callbacks.onRequestContext!({
        ...{
          type: 'search',
          version: 1,
        },
        ...contextRequestV1,
      })) as ContextV1.ContextResponse;

      expect(context).toEqual({
        sequenceDiagrams: ['diagram-1'],
        codeSnippets: { 'app/user.rb': 'class User < ApplicationRecord; end' },
        codeObjects: ['SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT 1'],
      });

      callbacks.onComplete();
      expect(completeFn).toHaveBeenCalled();
    });
  });
});
