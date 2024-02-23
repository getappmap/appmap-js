import { warn } from 'console';
import EventEmitter from 'events';

import { AI } from '@appland/client';
import { verbose } from '../../../utils';
import { ContextProvider, default as INavie } from './inavie';

export default class RemoteNavie extends EventEmitter implements INavie {
  constructor(public threadId: string | undefined, private contextProvider: ContextProvider) {
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
          return await self.contextProvider(data);
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
