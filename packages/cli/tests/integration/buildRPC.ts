import jayson from 'jayson/promise';

import RPCServer from '../../src/cmds/index/rpcServer';
import { RpcHandler } from '../../src/rpc/rpc';
import { numProcessed } from '../../src/rpc/index/numProcessed';
import { search } from '../../src/rpc/search/search';
import appmapData from '../../src/rpc/appmap/data';
import appmapStats from '../../src/rpc/appmap/stats';
import metadata from '../../src/rpc/appmap/metadata';
import sequenceDiagram from '../../src/rpc/appmap/sequenceDiagram';
import { explainHandler, explainStatusHandler } from '../../src/rpc/explain/explain';
import { waitFor } from './waitFor';
import FingerprintWatchCommand from '../../src/fingerprint/fingerprintWatchCommand';
import { INavieProvider } from '../../src/rpc/explain/navie/inavie';

export type RPC = {
  server: RPCServer;
  client: jayson.Client;
};

export async function buildRPC(navieProvider: INavieProvider): Promise<RPC> {
  const fingerprintWatchCommand = {
    numProcessed: 0,
  } as FingerprintWatchCommand;

  const handlers: RpcHandler<any, any>[] = [
    numProcessed(fingerprintWatchCommand),
    search(),
    appmapStats(),
    appmapData(),
    metadata(),
    sequenceDiagram(),
    explainHandler(navieProvider),
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
