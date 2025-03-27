import { AppMapRpc, ConfigurationRpc, ExplainRpc, NavieRpc } from '@appland/rpc';
import { browserClient, reportError } from './RPC';
import type ClientBrowser from 'jayson/lib/client/browser';

import { EventEmitter } from 'events';

// From jayson Server.errors
// This is defined here to avoid pulling in node dependencies
const METHOD_NOT_FOUND = -32601;

export type UserInput = {
  question: string;
  codeSelection?: string | ExplainRpc.UserContextItem[];
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
    let codeSelection: string | ExplainRpc.UserContextItem[] | undefined;
    let appmaps: string[] | undefined;
    if (typeof input === 'string') {
      question = input;
    } else {
      question = input.question;
      codeSelection = input.codeSelection;
      appmaps = input.appmaps;
    }
    const explainOptions: ExplainRpc.ExplainOptions = {
      question,
      appmaps,
      threadId,
      codeSelection,
    };

    return new Promise<string>((resolve, reject) => {
      this.client.request(
        ExplainRpc.ExplainFunctionName,
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
        (err: any, error: any, statusResponse: ExplainRpc.ExplainStatusResponse) => {
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

          if (statusResponse.step === 'error') this.onError(statusResponse.err);

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

function validateEvent(event: any): asserts event is { type: string; [key: string]: unknown } {
  if (event.type === undefined) throw new Error('Missing event type');
}

class SubscribeListener {
  private readonly emitter = new EventEmitter();
  private _connectionClosed = false;
  private reader?: ReadableStreamDefaultReader;

  get connectionClosed(): boolean {
    return this._connectionClosed;
  }

  emit(event: 'connected', data?: never): void;
  emit(event: 'event', data: any): void;
  emit(event: string, data: any) {
    this.emitter.emit(event, data);
  }

  on(event: 'connected', listener: () => void): this;
  on(event: 'event', listener: (event: any) => void): this;
  on(event: string, listener: (event: any) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  updateReader(reader: ReadableStreamDefaultReader) {
    this.reader = reader;
  }

  close() {
    this.reader?.cancel().catch(console.error);
    this._connectionClosed = true;
    this.emitter.removeAllListeners('event');
  }
}

export default class AppMapRPC {
  private readonly client: ClientBrowser;
  private readonly port?: number;

  constructor(portOrClient: number | ClientBrowser) {
    if (typeof portOrClient === 'number') {
      this.port = portOrClient;
    }
    this.client = typeof portOrClient === 'number' ? browserClient(portOrClient) : portOrClient;
  }

  listMethods(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.client.request(
        'system.listMethods',
        {},
        function (err: any, error: any, result: string[]) {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
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

  register(): Promise<NavieRpc.V1.Register.Response> {
    return new Promise((resolve, reject) => {
      this.client.request(
        NavieRpc.V1.Register.Method,
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

  update(filePath: string, modifiedContent: string, originalContent?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.request(
        'file.update',
        { file: filePath, modified: modifiedContent, original: originalContent },
        (err: any, error: any, { succeeded }: UpdateResult) => {
          if (err || error) return reportError(reject, err, error);

          succeeded
            ? resolve()
            : reject(new Error(`Failed to update ${filePath}. Please try again.`));
        }
      );
    });
  }

  // If the server does not provide v2.navie.metadata, use this method to obtain the welcome
  // message, input placeholder, and commands.
  metadataV1(): Promise<NavieRpc.V1.Metadata.Response> {
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

  // If the server provides v2.navie.metadata, use this method to obtain the input placeholder and
  // commands. It will return without delay, enabling the input placeholder and command list to
  // be displayed immediately.
  //
  // Use the welcome method to obtain the activity name and the suggestions.
  metadataV2(): Promise<NavieRpc.V2.Metadata.Response> {
    return new Promise((resolve, reject) => {
      this.client.request(
        NavieRpc.V2.Metadata.Method,
        undefined,
        (err: any, error: any, result: NavieRpc.V2.Metadata.Response) => {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  // If the server provides v2.navie.welcome, use this method to obtain the welcome message, activity
  // name, and suggestions. There will be some delay while the project state is analyzed.
  welcome(codeSelection?: string): Promise<NavieRpc.V2.Welcome.Response> {
    return new Promise((resolve, reject) => {
      this.client.request(
        NavieRpc.V2.Welcome.Method,
        { codeSelection },
        (err: any, error: any, result: NavieRpc.V2.Welcome.Response) => {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  suggest(threadId: string): Promise<NavieRpc.V1.Suggest.Response> {
    return new Promise((resolve, reject) => {
      this.client.request(
        NavieRpc.V1.Suggest.Method,
        { threadId },
        (err: any, error: any, result: NavieRpc.V1.Suggest.Response) => {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  loadThread(threadId: string): Promise<ExplainRpc.LoadThreadResponse> {
    return new Promise((resolve, reject) => {
      this.client.request(
        ExplainRpc.ExplainThreadLoadFunctionName,
        { threadId },
        (err: any, error: any, result: ExplainRpc.LoadThreadResponse) => {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  listModels(): Promise<NavieRpc.V1.Models.Model[]> {
    return new Promise((resolve, reject) => {
      this.client.request(
        NavieRpc.V1.Models.List.Method,
        {},
        (err: any, error: any, result: NavieRpc.V1.Models.Model[]) => {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  selectModel(model: { provider?: string | undefined; id: string }): Promise<void> {
    let serializedId: string | undefined;
    if (model) {
      serializedId = [model.provider, model.id]
        .filter((part): part is string => Boolean(part))
        .map((part) => encodeURIComponent(part))
        .join(':');
    }

    return new Promise((resolve, reject) => {
      this.client.request(NavieRpc.V1.Models.Select.Method, { id: serializedId }, (err: any) => {
        if (err) return reportError(reject, err, err);

        resolve();
      });
    });
  }

  getModelConfig(): Promise<NavieRpc.V1.Models.Config[]> {
    return new Promise((resolve, reject) => {
      this.client.request(
        NavieRpc.V1.Models.GetConfig.Method,
        {},
        (err: any, error: any, result: NavieRpc.V1.Models.Config[]) => {
          if (err || error) return reportError(reject, err, error);

          resolve(result);
        }
      );
    });
  }

  public readonly thread = {
    subscribe: async (threadId?: string, replay?: boolean, nonce?: number) => {
      if (!this.port) throw new Error('RPC client is not connected');

      let lastAckedNonce = nonce ?? 0;
      const listener = new SubscribeListener();
      const connect = async (nonce?: number): Promise<void> => {
        const payload = {
          jsonrpc: '2.0',
          method: NavieRpc.V1.Thread.Subscribe.Method,
          params: { threadId, nonce, replay },
          id: 1,
        };

        let response;
        try {
          response = await fetch(`http://localhost:${this.port}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.error('Failed to connect to RPC server', e);
          return reconnect();
        }

        if (!response.ok) {
          return reconnect();
        }

        const reader = response.body?.getReader();
        if (!reader) {
          return listener.connectionClosed ? reconnect() : undefined;
        }

        listener.updateReader(reader);
        listener.emit('connected');

        const decoder = new TextDecoder();
        let buffer = '';

        setTimeout(async () => {
          try {
            for (;;) {
              if (listener.connectionClosed) {
                return;
              }

              const { value, done } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value);
              for (;;) {
                const newLineIndex = buffer.indexOf('\n');
                if (newLineIndex === -1) break;

                const line = buffer.slice(0, newLineIndex);
                buffer = buffer.slice(newLineIndex + 1);
                if (line.length === 0) continue;

                try {
                  const event = JSON.parse(line.replace(/^data: /, ''));
                  if (event.type === 'client-error') {
                    console.error('Client error', event.error);
                    if (event.shouldRetry) {
                      console.error('Attempting to reconnect...');
                      return reconnect();
                    } else {
                      return;
                    }
                  }
                  lastAckedNonce += 1;
                  validateEvent(event);
                  listener.emit('event', event);
                } catch (e) {
                  console.error('Failed to parse event', line);
                  console.error(e);
                }
              }
            }
          } catch (e) {
            console.error('A network error occurred:', e);
            console.error('Attempting to reconnect...');
            return reconnect();
          }
        });
      };

      const reconnect = async (reconnectTimeoutMs = 1000) => {
        // No need for an exponential backoff here, since the connection is
        // local and the chances of a network error are low unless the server
        // is restarting.
        await new Promise((resolve) => setTimeout(resolve, reconnectTimeoutMs));
        return connect(lastAckedNonce);
      };

      connect();

      return listener;
    },
    pinItem: (threadId: string, pinnedItem: any) =>
      this.client.request(
        NavieRpc.V1.Thread.PinItem.Method,
        { threadId, pinnedItem },
        (err: any, error: any, result: NavieRpc.V1.Thread.PinItem.Response) => {
          if (err || error) return reportError(Promise.reject, err, error);

          return result;
        }
      ),
    unpinItem: (threadId: string, pinnedItem: any) =>
      this.client.request(
        NavieRpc.V1.Thread.UnpinItem.Method,
        { threadId, pinnedItem },
        (err: any, error: any, result: NavieRpc.V1.Thread.UnpinItem.Response) => {
          if (err || error) return reportError(Promise.reject, err, error);

          return result;
        }
      ),
    addMessageAttachment: (threadId: string, uri?: string, content?: string) =>
      this.client.request(
        NavieRpc.V1.Thread.AddMessageAttachment.Method,
        { threadId, uri, content },
        (err: any, error: any, result: NavieRpc.V1.Thread.AddMessageAttachment.Response) => {
          if (err || error) return reportError(Promise.reject, err, error);

          return result;
        }
      ),
    removeMessageAttachment: (threadId: string, attachmentId: string) =>
      this.client.request(
        NavieRpc.V1.Thread.RemoveMessageAttachment.Method,
        { threadId, attachmentId },
        (err: any, error: any, result: NavieRpc.V1.Thread.RemoveMessageAttachment.Response) => {
          if (err || error) return reportError(Promise.reject, err, error);

          return result;
        }
      ),
    sendMessage: (threadId: string, content: string, userContext?: any[]) =>
      this.client.request(
        NavieRpc.V1.Thread.SendMessage.Method,
        { threadId, content, userContext },
        (err: any, error: any, result: NavieRpc.V1.Thread.SendMessage.Response) => {
          if (err || error) return reportError(Promise.reject, err, error);

          return result;
        }
      ),
  };
}
