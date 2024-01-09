import AppMapRpc from '@/lib/AppMapRPC';

describe('AppMapRPC', () => {
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
