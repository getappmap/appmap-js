import jayson, { MethodLike } from 'jayson';
import { log, warn } from 'console';

import { RpcCallback, RpcError, RpcHandler } from '../../rpc/rpc';
import assert from 'assert';

function handlerMiddleware(
  name: string,
  handler: (args: any) => unknown | Promise<unknown>
): (args: any, callback: RpcCallback<unknown>) => Promise<void> {
  return async (args, callback) => {
    warn(`Handling JSON-RPC request for ${name} (${JSON.stringify(args)})`);
    try {
      callback(null, await handler(args));
    } catch (err) {
      let error: RpcError | undefined;
      if (err instanceof RpcError) {
        error = err;
      } else {
        error = new RpcError(500, RpcError.errorMessage(err));
      }
      callback(error);
    }
  };
}

export default class RPCServer {
  bindPort: number;
  server: jayson.HttpServer | undefined;

  public port: number | undefined;

  constructor(port: number, public rpcHandlers: RpcHandler<unknown, unknown>[]) {
    this.bindPort = port;
  }

  start() {
    assert(this.server === undefined, 'RPC server already started');

    const rpcMethods: Record<string, MethodLike> = this.rpcHandlers.reduce((acc, handler) => {
      acc[handler.name] = handlerMiddleware(handler.name, handler.handler);
      return acc;
    }, {});

    log(`Available JSON-RPC methods: ${Object.keys(rpcMethods).sort().join(', ')}`);
    warn(`Consult @appland/rpc for request and response data types.`);

    this.server = new jayson.Server(rpcMethods).http();
    this.server.listen(this.bindPort).on('listening', () => {
      assert(this.server);
      const address = this.server.address();
      if (address === null) {
        throw new Error(`Failed to listen on port ${this.port} (address is null)`);
      } else if (typeof address === 'string') {
        log(`Running JSON-RPC server on: ${address}`);
      } else {
        this.port = address.port;
        log(`Running JSON-RPC server on port: ${this.port}`);
      }
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}
