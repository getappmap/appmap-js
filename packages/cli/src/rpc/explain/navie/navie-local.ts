import EventEmitter from 'events';
import { explain, Explain } from '@appland/navie';

import INavie, { ContextProvider } from './inavie';
import { SearchContextResponse } from '../explain';
import { randomUUID } from 'crypto';

export default class LocalNavie extends EventEmitter implements INavie {
  constructor(
    public threadId: string | undefined,
    private readonly contextProvider: ContextProvider
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
      requestContext: this.contextProvider as (data: any) => Promise<SearchContextResponse>,
    };
    // TODO: Make configurable
    const options = new Explain.ExplainOptions();
    // TODO: Provide
    const chatHistory = [];

    const explainer = explain(clientRequest, options, chatHistory);
    for await (const token of explainer.execute()) {
      this.emit('token', token);
    }
    this.emit('complete');
  }
}
