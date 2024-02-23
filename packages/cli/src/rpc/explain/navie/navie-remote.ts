import { warn } from 'console';
import EventEmitter from 'events';

import { AI } from '@appland/client';
import { verbose } from '../../../utils';
import { default as INavie } from './inavie';
import { Context, ContextRequest } from '@appland/navie';

export default class RemoteNavie extends EventEmitter implements INavie {
  constructor(
    public threadId: string | undefined,
    private contextProvider: Context.ContextProvider
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
          if (data.type === 'search') {
            return await self.contextProvider(data as unknown as ContextRequest);
          } else {
            warn(`Unhandled context request type: ${data.type}`);
            // A response is required from this function.
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
