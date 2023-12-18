import { IndexRpc } from '@appland/rpc';

import { RpcResponse } from './RpcResponse';
import RPCTest from './RPCTest';

describe('RPC', () => {
  const rpcTest = new RPCTest();

  beforeAll(async () => await rpcTest.setup());
  afterAll(() => rpcTest.teardown());

  describe('non-existent method', () => {
    it('returns an error', async () => {
      const result = await rpcTest.client.request('nonexistent', []);
      expect(Object.keys(result).sort()).toEqual(['error', 'id', 'jsonrpc']);
      expect(result.error).toEqual({ code: -32601, message: 'Method not found' });
    });
  });

  describe('index.numProcessed', () => {
    it('is initially 0', async () => {
      const result: RpcResponse<IndexRpc.NumProcessedResponse> = await rpcTest.client.request(
        IndexRpc.NumProcessedFunctionName,
        []
      );

      expect(result.result).toEqual(0);
    });
  });
});
