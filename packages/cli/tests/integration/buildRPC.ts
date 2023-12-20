import jayson from 'jayson/promise';

import RPCServer from '../../src/cmds/index/rpcServer';
import { RpcHandler } from '../../src/rpc/rpc';
import { numProcessed } from '../../src/rpc/index/numProcessed';
import { search } from '../../src/rpc/search/search';
import appmapData from '../../src/rpc/appmap/data';
import metadata from '../../src/rpc/appmap/metadata';
import sequenceDiagram from '../../src/rpc/appmap/sequenceDiagram';
import { explainHandler, explainStatusHandler } from '../../src/rpc/explain/explain';
import { waitFor } from './waitFor';
import FingerprintWatchCommand from '../../src/fingerprint/fingerprintWatchCommand';

export type RPC = {
  server: RPCServer;
  client: jayson.Client;
};

export async function buildRPC(): Promise<RPC> {
  const fingerprintWatchCommand = {
    numProcessed: 0,
  } as FingerprintWatchCommand;

  const handlers: RpcHandler<any, any>[] = [
    numProcessed(fingerprintWatchCommand),
    search('.'),
    appmapData(),
    metadata(),
    sequenceDiagram(),
    explainHandler('.'),
    explainStatusHandler(),
  ];

  const rpcServer = new RPCServer(0, handlers);
  rpcServer.start();
  rpcServer.unref();
  await waitFor(() => rpcServer?.port !== undefined);

  const rpcClient = jayson.Client.http({ port: rpcServer.port });

  return {
    server: rpcServer,
    client: rpcClient,
  };
}
