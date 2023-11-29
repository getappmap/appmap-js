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
}
