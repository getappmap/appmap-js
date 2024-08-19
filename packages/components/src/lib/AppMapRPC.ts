import { AppMapRpc, ConfigurationRpc, NavieRpc } from '@appland/rpc';
import { browserClient, reportError } from './RPC';

import { EventEmitter } from 'events';

// From jayson Server.errors
// This is defined here to avoid pulling in node dependencies
const METHOD_NOT_FOUND = -32601;

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

type UpdateResult = {
  succeeded: boolean;
};

export class ExplainRequest extends EventEmitter {
  client: any;
  private statusInterval?: number;

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

  stop() {
    this.stopPolling();
    this.client.request('v1.explain.stop', null, (err: any, error: any) => {
      if (error?.error?.code === METHOD_NOT_FOUND) return;
      reportError(this.onError.bind(this), err, error);
    });
    this.emit('stop');
  }

  protected pollForStatus(userMessageId: string, pollInterval = 500) {
    let numTokens = 0;

    this.statusInterval = window.setInterval(() => {
      this.client.request(
        'explain.status',
        { userMessageId },
        (err: any, error: any, statusResponse: any) => {
          // Stop polling if the user message is no longer available from the server,
          // for example if the RPC service has been restarted.
          if (error && error.code === 404) this.stopPolling();

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
            this.stopPolling();
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

  protected stopPolling() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = undefined;
    }
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

  configuration(): Promise<ConfigurationRpc.V2.Get.Response> {
    return new Promise((resolve, reject) => {
      this.client.request(
        ConfigurationRpc.V2.Get.Method,
        undefined,
        (err: any, error: any, result: any) => {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  explain(): ExplainRequest {
    return new ExplainRequest(this.client);
  }

  update(filePath: string, modifiedContent: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.request(
        'file.update',
        { file: filePath, modified: modifiedContent },
        (err: any, error: any, { succeeded }: UpdateResult) => {
          if (err || error) return reportError(reject, err, error);

          succeeded
            ? resolve()
            : reject(new Error(`Failed to update ${filePath}. Please try again.`));
        }
      );
    });
  }

  metadata(): Promise<NavieRpc.V1.Metadata.Response> {
    return new Promise((resolve, reject) => {
      this.client.request(
        NavieRpc.V1.Metadata.Method,
        undefined,
        (err: any, error: any, result: NavieRpc.V1.Metadata.Response) => {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  emitUiEvent(event: string): Promise<NavieRpc.V1.UIEvent.Response> {
    return new Promise((resolve, reject) => {
      this.client.request(
        NavieRpc.V1.UIEvent.Method,
        { event },
        (err: any, error: any, result: NavieRpc.V1.UIEvent.Response) => {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }
}
