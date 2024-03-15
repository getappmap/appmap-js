import jayson from 'jayson/promise';

import RPCServer from '../../src/cmds/index/rpcServer';
import { RpcHandler } from '../../src/rpc/rpc';
import { numProcessed } from '../../src/rpc/index/numProcessed';
import { search } from '../../src/rpc/search/search';
import appmapData from '../../src/rpc/appmap/data';
import { appmapStatsV1, appmapStatsV2 } from '../../src/rpc/appmap/stats';
import metadata from '../../src/rpc/appmap/metadata';
import sequenceDiagram from '../../src/rpc/appmap/sequenceDiagram';
import { explainHandler, explainStatusHandler } from '../../src/rpc/explain/explain';
import { waitFor } from './waitFor';
import FingerprintWatchCommand from '../../src/fingerprint/fingerprintWatchCommand';
import { INavieProvider } from '../../src/rpc/explain/navie/inavie';
import { getConfigurationV1, setConfigurationV1 } from '../../src/rpc/configuration';

export type RPC = {
  server: RPCServer;
  client: jayson.Client;
};

// Runs an RPC server in-process with the given navieProvider. Because the RPC server
// is in-process, the server functionality (e.g. connections to remote services) can be
// mocked as needed.
//
// Returns an RPC client that can be used to make requests to the server.
export async function buildRPC(navieProvider: INavieProvider): Promise<RPC> {
  const fingerprintWatchCommand = {
    numProcessed: 0,
  } as FingerprintWatchCommand;

  const handlers: RpcHandler<any, any>[] = [
    numProcessed(fingerprintWatchCommand),
    search(),
    appmapStatsV1(),
    appmapStatsV2(),
    appmapData(),
    metadata(),
    sequenceDiagram(),
    explainHandler(navieProvider),
    explainStatusHandler(),
    getConfigurationV1(),
    setConfigurationV1(),
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
