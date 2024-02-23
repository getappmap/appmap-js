import EventEmitter from 'events';
import { Context, Explain, explain } from '@appland/navie';

import INavie from './inavie';
import { randomUUID } from 'crypto';
import { verbose } from '../../../utils';

export default class LocalNavie extends EventEmitter implements INavie {
  constructor(
    public threadId: string | undefined,
    private readonly contextProvider: Context.ContextProvider
  ) {
    super();
  }

  async ask(question: string, codeSelection: string | undefined): Promise<void> {
    if (!this.threadId) {
      this.threadId = randomUUID();
    }
    const messageId = randomUUID();
    this.emit('ack', messageId, this.threadId);

    const clientRequest: Explain.ClientRequest = {
      question,
      codeSelection,
    };
    // TODO: Make configurable
    const options = new Explain.ExplainOptions();
    // TODO: Provide
    const chatHistory = [];

    const explainFn = explain(clientRequest, this.contextProvider, options, chatHistory);
    explainFn.on('event', (event) => {
      if (verbose()) console.log(event.message);
    });
    for await (const token of explainFn.execute()) {
      this.emit('token', token);
    }
    this.emit('complete');
  }
}
