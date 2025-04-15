import { Server } from 'node:http';

export default function shadowLocalhost(server: Server): Promise<Server> {
  if (server.listening) return createShadow(server);
  else
    return new Promise((resolve, reject) =>
      server.on('listening', () => {
        try {
          resolve(createShadow(server));
        } catch (e) {
          reject(e);
        }
      })
    );
}

function createShadow(server: Server): Promise<Server> {
  const address = server.address();
  if (address === null) {
    throw new Error('Server has no address');
  } else if (typeof address === 'string') {
    throw new Error('Server is not IP');
  } else {
    const host = otherHost(address);
    const shadow = new Server((...args) => server.emit('request', ...args)).unref();
    return new Promise((resolve, reject) =>
      shadow
        .listen(address.port, host, () => {
          server.on('close', () => shadow.close());
          resolve(shadow);
        })
        .on('upgrade', (...args) => server.emit('upgrade', ...args))
        .on('error', reject)
    );
  }
}

function otherHost(address: { port: number; family: string; address: string }): string {
  if (!['127.0.0.1', '::1', 'localhost'].includes(address.address))
    throw new Error(`Server is not localhost: ${address.address}`);
  if (address.family === 'IPv6') {
    return '127.0.0.1';
  } else {
    return '::1';
  }
}
