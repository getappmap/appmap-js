import { io } from 'socket.io-client';
import AIClient, { Callbacks } from './aiClient';
import { getConfiguration } from './loadConfiguration';

// eslint-disable-next-line unicorn/no-static-only-class
export default class AI {
  static async connect(callbacks: Callbacks): Promise<AIClient> {
    const configuration = getConfiguration();
    const socket = io(configuration.apiURL.replace(/^http/, 'ws'), {
      transports: ['websocket'],
      path: '/v1/ai/conversation',
      reconnection: false,
      auth: {
        token: configuration.apiKey,
      },
    });

    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        resolve(new AIClient(socket, callbacks));
      });
      socket.on('connect_error', (error) => {
        reject(error);
      });
    });
  }

  static async sendMessageFeedback(messageId: string, sentiment: number) {
    const configuration = getConfiguration();
    if (!configuration.apiKey) {
      throw new Error('Authentication is required to send feedback');
    }

    const response = await fetch(`${configuration.apiURL}/v1/ai/feedback`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${configuration.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageId,
        sentiment,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send feedback');
    }
  }

  static async classify(question: string): Promise<string> {
    let resolve: (value: string) => void;
    let reject: (error: Error) => void;

    const tokens = new Array<string>();
    const client = await AI.connect({
      onToken(token: string) {
        tokens.push(token);
      },
      onComplete() {
        resolve(tokens.join(' '));
      },
      onError(error: Error) {
        reject(error);
      },
    });
    client.inputPrompt(question, { tool: 'classify' });

    return new Promise<string>((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
  }
}
