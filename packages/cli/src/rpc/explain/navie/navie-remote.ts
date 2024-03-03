import { warn } from 'console';
import EventEmitter from 'events';

import { AI } from '@appland/client';
import { verbose } from '../../../utils';
import { default as INavie } from './inavie';
import { Context, ProjectInfo } from '@appland/navie';

export default class RemoteNavie extends EventEmitter implements INavie {
  constructor(
    public threadId: string | undefined,
    private contextProvider: Context.ContextProvider,
    private projectInfoProvider: ProjectInfo.ProjectInfoProvider
  ) {
    super();
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
              return await self.contextProvider(data as unknown as Context.ContextRequest);
            }
            if (data.type === 'projectInfo') {
              return (
                (await self.projectInfoProvider(
                  data as unknown as ProjectInfo.ProjectInfoRequest
                )) || {}
              );
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
