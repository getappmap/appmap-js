import AppMapRpc from '@/lib/AppMapRPC';

describe('AppMapRPC', () => {
  describe('constructor', () => {
    it('accepts a port number (backward compatibility)', () => {
      const rpc = new AppMapRpc(3000);
      expect(rpc).toBeDefined();
      expect(rpc.port).toBe(3000);
    });

    it('accepts a full HTTP URL', () => {
      const rpc = new AppMapRpc('http://remote-server:8080');
      expect(rpc).toBeDefined();
      expect(rpc.httpUrl).toBe('http://remote-server:8080');
      expect(rpc.wsUrl).toBe('ws://remote-server:8080');
    });

    it('accepts a full HTTPS URL and converts to WSS', () => {
      const rpc = new AppMapRpc('https://secure.example.com/rpc');
      expect(rpc).toBeDefined();
      expect(rpc.httpUrl).toBe('https://secure.example.com/rpc');
      expect(rpc.wsUrl).toBe('wss://secure.example.com/rpc');
    });

    it('accepts a protocol-less URL', () => {
      const rpc = new AppMapRpc('remote-server:8080');
      expect(rpc).toBeDefined();
      expect(rpc.httpUrl).toBe('http://remote-server:8080');
      expect(rpc.wsUrl).toBe('ws://remote-server:8080');
    });

    it('accepts a ClientBrowser instance', () => {
      const mockClient = {
        request: jest.fn(),
      };
      const rpc = new AppMapRpc(mockClient);
      expect(rpc).toBeDefined();
      // Should have default URLs when client is provided
      expect(rpc.httpUrl).toBe('http://localhost:30101');
      expect(rpc.wsUrl).toBe('ws://localhost:30101');
    });

    it('uses default port when undefined is passed', () => {
      const mockClient = {
        request: jest.fn(),
      };
      const rpc = new AppMapRpc(mockClient);
      expect(rpc.httpUrl).toBe('http://localhost:30101');
      expect(rpc.wsUrl).toBe('ws://localhost:30101');
    });
  });

  describe('explain', () => {
    it('stops polling for status once it gets a 404 error', () => {
      let client = {
        request: jest.fn(),
      };
      let statusCounter = 0;
      client.request.mockImplementation((method, params, callback) => {
        if (method === 'explain') {
          return callback(null, null, {
            userMessageId: 'the-request-id',
            threadId: 'the-request-id',
          });
        } else if (method === 'explain.status') {
          statusCounter += 1;
          if (statusCounter === 1) return callback(null, null, { step: 'build-vector-terms' });
          else if (statusCounter === 2) return callback(null, { code: 404, message: 'Not Found' });
          else callback(`unexpected call to explain.status with statusCounter=${statusCounter}`);
        }
      });

      const rpc = new AppMapRpc(client);
      const request = rpc.explain();
      return new Promise((resolve, reject) => {
        request.on('ack', (userMessageId, threadId) => {
          expect(userMessageId).toEqual('the-request-id');
          expect(threadId).toEqual('the-request-id');
        });
        request.on('error', (err) => {
          expect(err.code).toEqual(404);
          expect(err.message).toEqual('Not Found');
          // Wait before resolving to ensure that the polling loop has stopped.
          setTimeout(resolve, 100);
        });
        request.on('complete', () => {
          reject('complete should not be called');
        });
        request.on('token', () => {
          reject('token should not be called');
        });
        request.explain('How does password reset work?');
      });
    });
  });
});
