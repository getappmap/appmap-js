import { warn } from 'console';
import EventEmitter from 'events';
import { AI } from '@appland/client';
import { ContextV1, ContextV2, Help, ProjectInfo } from '@appland/navie';

import { verbose } from '../../../utils';
import { default as INavie } from './inavie';

export default class RemoteNavie extends EventEmitter implements INavie {
  constructor(
    public threadId: string | undefined,
    private contextProvider: ContextV2.ContextProvider,
    private projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    private helpProvider: Help.HelpProvider
  ) {
    super();
  }

  setOption(key: string, _value: string | number) {
    throw new Error(`RemoteNavie does not support option '${key}'`);
  }

  async ask(question: string, codeSelection: string | undefined) {
    const self = this;
    (
      await AI.connect({
        onAck(userMessageId, threadId) {
          if (verbose())
            warn(`Explain received ack (userMessageId=${userMessageId}, threadId=${threadId})`);
          self.emit('ack', userMessageId, threadId);
        },
        onToken(token, _messageId) {
          self.emit('token', token);
        },
        async onRequestContext(data) {
          try {
            if (data.type === 'search') {
              const { version } = data;
              const isVersion1 = !version || version === 1;

              // ContextV2.ContextRequest is a superset of ContextV1.ContextRequest, so whether the input
              // version is V1 or V2, we can treat it as V2.
              const contextRequestV2: ContextV2.ContextRequest = data as ContextV2.ContextRequest;

              const responseV2: ContextV2.ContextResponse = await self.contextProvider({
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
                      acc[item.location || ''] = item.content;
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
                (await self.projectInfoProvider(
                  data as unknown as ProjectInfo.ProjectInfoRequest
                )) || {}
              );
            }
            if (data.type === 'help') {
              return (await self.helpProvider(data as unknown as Help.HelpRequest)) || {};
            } else {
              warn(`Unhandled context request type: ${data.type}`);
              // A response is required from this function.
              return {};
            }
          } catch (e) {
            warn(`Explain context function ${data} threw an error: ${e}`);
            // TODO: Report an error object instead?
            return {};
          }
        },
        onComplete() {
          if (verbose()) warn(`Explain is complete`);
          self.emit('complete');
        },
        onError(err: Error) {
          if (verbose()) warn(`Error handled by Explain: ${err}`);
          self.emit('error', err);
        },
      })
    ).inputPrompt(
      { question: question, codeSelection: codeSelection },
      { threadId: self.threadId, tool: 'explain' }
    );
  }
}
