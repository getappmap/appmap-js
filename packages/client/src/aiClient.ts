// eslint-disable-next-line max-classes-per-file
import { Socket } from 'socket.io-client';

export type InputPromptOptions = {
  threadId?: string;
  tool?: string;
};

export class CodedError extends Error {
  constructor(message: string, public readonly code?: number) {
    super(message);
  }
}

export type Callbacks = {
  onToken: (token: string, messageId: string) => void;
  onComplete(): void;
  onRequestContext?: (
    data: Record<string, unknown>
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
  onAck?: (userMessageId: string, threadId: string) => void;
  onError?: (error: Error) => void;
};

export default class AIClient {
  constructor(private readonly socket: Socket, private readonly callbacks: Callbacks) {
    this.socket.on('exception', (error: Error) => {
      this.panic(error);
    });
    // eslint-disable-next-line unicorn/prevent-abbreviations
    this.socket.onAny((data: string, ...args: unknown[]) => {
      if (data === 'exception') {
        const { code, message } = args[0] as { message: string; code?: number };
        const error: Error = code ? new CodedError(message, code) : new Error(message);
        this.callbacks.onError?.(error);
        return;
      }

      try {
        const message = JSON.parse(data) as Record<string, unknown>;
        if (!('type' in message)) throw new Error('No message type');

        this.handleMessage(message as { type: string }).catch((error) => {
          this.panic(error as Error);
        });
      } catch (error) {
        this.panic(error as Error);
      }
    });
  }

  async handleMessage(message: { type: string; [key: string]: unknown }): Promise<void> {
    switch (message.type) {
      case 'ack':
        if (!('userMessageId' in message))
          this.panic(new Error('Unexpected ack message: no userMessageId'));
        if (!('threadId' in message)) this.panic(new Error('Unexpected ack message: no threadId'));
        this.callbacks.onAck?.(message.userMessageId as string, message.threadId as string);
        break;
      case 'token':
        if (!('token' in message)) this.panic(new Error('Unexpected token message: no token'));
        if (!('messageId' in message))
          this.panic(new Error('Unexpected token message: no messageId'));
        this.callbacks.onToken(message.token as string, message.messageId as string);
        break;
      case 'request-context': {
        if (!this.callbacks.onRequestContext) {
          this.panic(new Error('Unexpected request for context: no callback given'));
        }
        if (!('data' in message)) this.panic(new Error('Unexpected response: no data'));
        const data = message.data as Record<string, unknown>;
        const context = await this.callbacks.onRequestContext?.(data);
        this.socket.emit('message', JSON.stringify({ type: 'context', context }));
        break;
      }
      case 'end':
        this.callbacks.onComplete();
        this.disconnect();
        break;
      default:
        console.error(`Unknown message type ${message.type}`);
        this.disconnect();
    }
  }

  inputPrompt(input: string, options?: InputPromptOptions): void {
    this.socket.emit('prompt', {
      prompt: input,
      threadId: options?.threadId,
      tool: options?.tool,
    });
  }

  panic(error: Error): void {
    this.disconnect();
    this.callbacks.onError?.(error);
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
