import { warn } from 'console';
import EventEmitter from 'events';
import { AI } from '@appland/client';
import { ContextV1, ContextV2, Help, ProjectInfo } from '@appland/navie';

import { verbose } from '../../../utils';
import { default as INavie } from './inavie';
import assert from 'assert';

export class RemoteCallbackHandler {
  userMessageId: string | undefined;
  assistantMessageId: string | undefined;

  constructor(
    private readonly contextProvider: ContextV2.ContextProvider,
    private readonly projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    private readonly helpProvider: Help.HelpProvider
  ) {}

  async onRequestContext(
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | unknown[]> {
    try {
      if (data.type === 'search') {
        const { version } = data;
        const isVersion1 = !version || version === 1;

        // ContextV2.ContextRequest is a superset of ContextV1.ContextRequest, so whether the input
        // version is V1 or V2, we can treat it as V2.
        const contextRequestV2: ContextV2.ContextRequest = data as ContextV2.ContextRequest;

        const responseV2: ContextV2.ContextResponse = await this.contextProvider({
          ...contextRequestV2,
          type: 'search',
          version: 2,
        });

        if (isVersion1) {
          // Adapt from V2 response back to V1. Some data may be lost in this process.
          const responseV1: ContextV1.ContextResponse = {
            sequenceDiagrams: responseV2
              .filter((item) => item.type === ContextV2.ContextItemType.SequenceDiagram)
              .map((item) => item.content),
            codeSnippets: responseV2
              .filter((item) => item.type === ContextV2.ContextItemType.CodeSnippet)
              .reduce((acc, item) => {
                assert(item.type === ContextV2.ContextItemType.CodeSnippet);
                if (ContextV2.isFileContextItem(item)) {
                  acc[item.location] = item.content;
                }
                return acc;
              }, {} as Record<string, string>),
            codeObjects: responseV2
              .filter((item) => item.type === ContextV2.ContextItemType.DataRequest)
              .map((item) => item.content),
          };
          return responseV1;
        } else {
          return responseV2;
        }
      }
      if (data.type === 'projectInfo') {
        return (
          (await this.projectInfoProvider(data as unknown as ProjectInfo.ProjectInfoRequest)) ?? {}
        );
      }
      if (data.type === 'help') {
        return (await this.helpProvider(data as unknown as Help.HelpRequest)) || {};
      } else {
        warn(`Unhandled context request type: ${data.type}`);
        // A response is required from this function.
        return {};
      }
    } catch (e) {
      warn(`Explain context function ${JSON.stringify(data)} threw an error: ${e}`);
      return {};
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  onComplete(): void {
    if (verbose()) warn(`Explain is complete`);
  }

  onError(err: Error): void {
    if (verbose()) warn(`Error handled by Explain: ${err}`);
  }
}

export default class RemoteNavie extends EventEmitter implements INavie {
  constructor(
    private contextProvider: ContextV2.ContextProvider,
    private projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    private helpProvider: Help.HelpProvider
  ) {
    super();
  }

  get providerName() {
    return 'remote';
  }

  setOption(key: string, _value: string | number) {
    throw new Error(`RemoteNavie does not support option '${key}'`);
  }

  async ask(threadId: string, question: string, codeSelection?: string, prompt?: string) {
    const callbackHandler = new RemoteCallbackHandler(
      this.contextProvider,
      this.projectInfoProvider,
      this.helpProvider
    );

    const onAck = async (userMessageId: string, threadId: string) => {
      this.emit('ack', userMessageId, threadId);
    };

    const onToken = async (token: string, messageId: string): Promise<void> => {
      this.emit('token', token, messageId);
    };

    const onRequestContext = async (
      data: Record<string, unknown>
    ): Promise<Record<string, unknown> | unknown[]> => {
      return await callbackHandler.onRequestContext(data);
    };

    const onComplete = () => {
      callbackHandler.onComplete();
      this.emit('complete');
    };

    const onError = (err: Error) => {
      callbackHandler.onError(err);
      this.emit('error', err);
    };

    const callbacksObj = {
      onAck,
      onToken,
      onRequestContext,
      onComplete,
      onError,
    };

    (await AI.connect(callbacksObj)).inputPrompt(
      { question: question, codeSelection: codeSelection },
      { threadId, tool: 'explain' }
    );
  }

  terminate(): boolean {
    // Not implemented
    return false;
  }
}
