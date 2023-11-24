import assert from 'assert';
import jayson from 'jayson/promise';
import { IndexRpc } from '@appland/rpc';

import RPCServer from '../../src/cmds/index/rpcServer';
import { numProcessed } from '../../src/rpc/index/numProcessed';
import FingerprintWatchCommand from '../../src/fingerprint/fingerprintWatchCommand';
import { RpcHandler } from '../../src/rpc/rpc';

type RpcResponse<T> = {
  error?: { code: number; message: string };
  id: number;
  jsonrpc: string;
  result?: T;
};

async function waitFor(condition: () => Promise<boolean> | boolean, timeout = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timeout');
}

describe('RPC server', () => {
  let rpcServer: RPCServer | undefined;

  let fingerprintWatchCommand = {
    numProcessed: 0,
  } as FingerprintWatchCommand;

  const handlers: RpcHandler<any, any>[] = [numProcessed(fingerprintWatchCommand)];

  function rpcClient(): jayson.Client {
    assert(rpcServer);
    assert(rpcServer.port);
    return jayson.Client.http({ port: rpcServer.port });
  }

  beforeAll(async () => {
    rpcServer = new RPCServer(0, handlers);
    rpcServer.start();
    await waitFor(() => rpcServer?.port !== undefined);
  });

  afterAll(() => (rpcServer ? rpcServer.stop() : undefined));

  describe('non-existent method', () => {
    it('returns an error', async () => {
      const result = await rpcClient().request('nonexistent', []);
      expect(Object.keys(result).sort()).toEqual(['error', 'id', 'jsonrpc']);
      expect(result.error).toEqual({ code: -32601, message: 'Method not found' });
    });
  });

  describe('index.numProcessed', () => {
    it('is initially 0', async () => {
      const result: RpcResponse<IndexRpc.NumProcessedResponse> = await rpcClient().request(
        'index.numProcessed',
        []
      );

      expect(result.result).toEqual(0);
    });
  });
});
