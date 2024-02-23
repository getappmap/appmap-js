import EventEmitter from 'events';
import { ClientRequest, ExplainOptions, explain } from '@appland/navie';

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

    const clientRequest: ClientRequest = {
      question,
      codeSelection,
      requestContext: this.contextProvider as (data: any) => Promise<SearchContextResponse>,
    };
    // TODO: Make configurable
    const options = new ExplainOptions();
    // TODO: Provide
    const chatHistory = [];

    for await (const token of explain(clientRequest, options, chatHistory)) {
      this.emit('token', token);
    }
    this.emit('complete');
  }
}
