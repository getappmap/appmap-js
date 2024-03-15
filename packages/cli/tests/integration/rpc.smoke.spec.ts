import { IndexRpc } from '@appland/rpc';

import { RpcResponse } from './RpcResponse';
import { DEFAULT_WORKING_DIR, SingleDirectoryRPCTest as RPCTest } from './RPCTest';

describe('RPC', () => {
  const rpcTest = new RPCTest(DEFAULT_WORKING_DIR);

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
