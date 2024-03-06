import { IndexRpc } from '@appland/rpc';

import { RpcResponse } from './RpcResponse';
import RPCTest from './RPCTest';
import RemoteNavie from '../../src/rpc/explain/navie/navie-remote';

describe('RPC', () => {
  const rpcTest = new RPCTest(jest.fn() as any);

  beforeAll(async () => await rpcTest.setupAll());
  beforeEach(async () => await rpcTest.setupEach());
  afterEach(async () => await rpcTest.teardownEach());
  afterAll(async () => await rpcTest.teardownAll());

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
