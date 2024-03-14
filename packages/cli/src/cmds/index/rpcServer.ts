import connect from 'connect';
import { json as jsonParser } from 'body-parser';
import cors from 'connect-cors';
import jayson, { MethodLike } from 'jayson';
import { log, warn } from 'console';
import assert from 'assert';

import { RpcCallback, RpcError, RpcHandler } from '../../rpc/rpc';
import { Server } from 'http';
import { inspect } from 'util';
import { verbose } from '../../utils';

function handlerMiddleware(
  name: string,
  handler: (args: any) => unknown | Promise<unknown>
): (args: any, callback: RpcCallback<unknown>) => Promise<void> {
  return async (args, callback) => {
    if (verbose())
      log(`[RPCServer] Handling JSON-RPC request for ${name} (${JSON.stringify(args)})`);
    let err: any, result: any;
    try {
      result = await handler(args);
    } catch (error) {
      err = error;
    }

    if (err) {
      warn(`[RPCServer] An error occurred handling ${name}: ${inspect(err)}`);
      const error = RpcError.fromException(err);
      callback(error);
    } else {
      callback(null, result);
    }
  };
}

export default class RPCServer {
  bindPort: number;
  app: Server | undefined;

  public port: number | undefined;

  constructor(port: number, public rpcHandlers: RpcHandler<unknown, unknown>[]) {
    this.bindPort = port;
  }

  start() {
    assert(this.app === undefined, 'RPC server already started');

    const rpcMethods: Record<string, MethodLike> = this.rpcHandlers.reduce((acc, handler) => {
      const methodNames = Array.isArray(handler.name) ? handler.name : [handler.name];
      methodNames.forEach((methodName) => {
        acc[methodName] = handlerMiddleware(methodName, handler.handler);
      });
      return acc;
    }, {});

    log(`Available JSON-RPC methods: ${Object.keys(rpcMethods).sort().join(', ')}`);
    warn(`Consult @appland/rpc for request and response data types.`);

    const server = new jayson.Server(rpcMethods);
    const app = connect();
    app.use(cors({ methods: ['POST'] }));
    app.use(jsonParser());
    app.use(server.middleware());
    const listener = app.listen(this.bindPort);
    listener.on('listening', () => {
      const address = listener.address();
      if (address === null) {
        throw new Error(`Failed to listen on port ${this.port} (address is null)`);
      } else if (typeof address === 'string') {
        log(`Running JSON-RPC server on: ${address}`);
      } else {
        this.port = address.port;
        log(`Running JSON-RPC server on port: ${this.port}`);
      }
    });
    this.app = listener;
  }

  unref() {
    if (this.app) this.app.unref();
  }

  stop() {
    if (this.app) this.app.close(warn);
  }
}
