import { AppMapRpc, PromptRpc } from '@appland/rpc';
import { browserClient, reportError } from './RPC';

import { EventEmitter } from 'events';

type ExplainOptions = {
  question: string;
  codeSelection?: string;
  appmaps?: string[];
  threadId?: string;
};

type UserInput = {
  question: string;
  codeSelection?: string;
  appmaps?: string[];
};

export class ExplainRequest extends EventEmitter {
  client: any;

  constructor(client: any) {
    super();

    this.client = client;
  }

  explain(input: string | UserInput, threadId?: string): Promise<string> {
    let question: string;
    let codeSelection: string | undefined;
    let appmaps: string[] | undefined;
    if (typeof input === 'string') {
      question = input;
    } else {
      question = input.question;
      codeSelection = input.codeSelection;
      appmaps = input.appmaps;
    }
    const explainOptions: ExplainOptions = {
      question,
      appmaps,
      threadId,
      codeSelection,
    };

    return new Promise<string>((resolve, reject) => {
      this.client.request(
        'explain',
        explainOptions,
        (err: any, error: any, response: { userMessageId: string; threadId: string }) => {
          if (err || error) return reportError(reject, err, error);

          this.pollForStatus(response.userMessageId);
          this.onAck(response.userMessageId, response.threadId);

          resolve(response.userMessageId);
        }
      );
    });
  }

  protected pollForStatus(userMessageId: string, pollInterval = 500) {
    let numTokens = 0;

    const statusInterval = setInterval(() => {
      this.client.request(
        'explain.status',
        { userMessageId },
        (err: any, error: any, statusResponse: any) => {
          // Stop polling if the user message is no longer available from the server,
          // for example if the RPC service has been restarted.
          if (error && error.code === 404) clearInterval(statusInterval);

          if (err || error) return reportError(this.onError.bind(this), err, error);

          this.emit('status', statusResponse);

          const explanation = statusResponse.explanation || [];
          const newTokenCount = explanation.length - numTokens;
          if (newTokenCount > 0) {
            const newTokens = explanation.slice(-newTokenCount);
            for (const token of newTokens) this.onToken(token, userMessageId);
          }
          numTokens = explanation.length;

          if (['complete', 'error'].includes(statusResponse.step)) {
            clearInterval(statusInterval);
            this.onComplete();
          }
        }
      );
    }, pollInterval);
  }

  protected onError(err: any) {
    this.emit('error', err);
  }

  protected onAck(userMessageId: string, threadId: string) {
    this.emit('ack', userMessageId, threadId);
  }

  protected onToken(token: string, messageId: string) {
    this.emit('token', token, messageId);
  }

  protected onComplete() {
    this.emit('complete');
  }
}

export default class AppMapRPC {
  client: any;

  constructor(portOrClient: number | any) {
    this.client = typeof portOrClient === 'number' ? browserClient(portOrClient) : portOrClient;
  }

  appmapStats(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.request(
        AppMapRpc.Stats.V2.Method,
        {},
        function (err: any, error: any, result: any) {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  appmapData(appmapId: string, filter: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        'appmap.data',
        { appmap: appmapId, filter },
        function (err: any, error: any, result: any) {
          if (err || error) return reportError(reject, err, error);

          resolve(result as string);
        }
      );
    });
  }

  appmapMetadata(appmapId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        'appmap.metadata',
        { appmap: appmapId },
        function (err: any, error: any, result: any) {
          if (err || error) return reportError(reject, err, error);

          resolve(result as string);
        }
      );
    });
  }

  promptSuggestions(): Promise<PromptRpc.V1.Suggestions.Response> {
    return new Promise((resolve, reject) => {
      this.client.request(
        PromptRpc.V1.Suggestions.Method,
        {},
        function (err: any, error: any, result: PromptRpc.V1.Suggestions.Response) {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  explain(): ExplainRequest {
    return new ExplainRequest(this.client);
  }
}
