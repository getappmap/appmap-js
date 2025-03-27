import connect from 'connect';
import { json as jsonParser } from 'body-parser';
import makeDebug from 'debug';
import jayson, { MethodLike } from 'jayson';
import { log, warn } from 'console';
import assert from 'assert';

import cors from 'cors';

import { Server } from 'http';

import shadowLocalhost from '../../lib/shadowLocalhost';
import { RpcCallback, RpcHandler, toJaysonRpcError } from '../../rpc/rpc';
import { sseMiddleware } from '../../rpc/navie/thread/middleware';

const debug = makeDebug('appmap:rpcServer');

function handlerMiddleware<Args, Result>(
  name: string,
  handler: (args: Args) => Result | Promise<Result>
): (args: Args, callback: RpcCallback<Result>) => Promise<void> {
  return async (args, callback) => {
    debug(`[RPCServer] Handling JSON-RPC request for ${name} (${JSON.stringify(args)})`);
    try {
      const result = await handler(args);
      debug(`[RPCServer] JSON-RPC response for ${name}: ${JSON.stringify(result)}`);
      callback(null, result);
    } catch (error) {
      debug(`[RPCServer] JSON-RPC error for ${name}: ${JSON.stringify(error)}`);
      callback(toJaysonRpcError(error));
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

  start(portCb?: (port: number) => void) {
    assert(this.app === undefined, 'RPC server already started');

    const rpcMethods: Record<string, MethodLike> = this.rpcHandlers.reduce((acc, handler) => {
      const methodNames = Array.isArray(handler.name) ? handler.name : [handler.name];
      methodNames.forEach((methodName) => {
        acc[methodName] = handlerMiddleware(methodName, handler.handler);
      });
      return acc;
    }, {});

    rpcMethods['system.listMethods'] = (args, callback) => {
      callback(null, Object.keys(rpcMethods));
    };

    log(`Available JSON-RPC methods: ${Object.keys(rpcMethods).sort().join(', ')}`);
    warn(`Consult @appland/rpc for request and response data types.`);

    const server = new jayson.Server(rpcMethods);
    const app = connect();
    app.use(cors({ methods: ['POST'] }));
    app.use(jsonParser());
    app.use(sseMiddleware());
    app.use(server.middleware());
    const listener = app.listen(this.bindPort, 'localhost');

    // In some environments the client and server can resolve localhost to
    // different address families leading them to be unable to communicate.
    // Try to start a shadow server on the other family to prevent that.
    void shadowLocalhost(listener).catch(
      // ignore errors, it's just a shadow server
      // (errors will most likely occur when the other address family is unavailable)
      debug
    );

    listener.on('listening', () => {
      const address = listener.address();
      if (address === null) {
        throw new Error(`Failed to listen on port ${this.port} (address is null)`);
      } else if (typeof address === 'string') {
        log(`Running JSON-RPC server on: ${address}`);
      } else {
        this.port = address.port;
        log(`Running JSON-RPC server on port: ${this.port}`);
        if (portCb) portCb(this.port);
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
