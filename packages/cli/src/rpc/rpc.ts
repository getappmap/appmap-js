import { warn } from 'console';
import jayson from 'jayson';
import { inspect } from 'util';

export type RpcHandler<CallT, ResponseT> = {
  name: string;
  handler: (args: CallT) => ResponseT | Promise<ResponseT>;
};

export class RpcError extends Error implements jayson.JSONRPCError {
  static fromException(err: Error): jayson.JSONRPCError {
    let rpcError: jayson.JSONRPCError;
    warn(`Handling exception: ${inspect(err)}`);
    if (err.stack) warn(`Stack trace: ${err.stack}`);
    if (err.cause) warn(`Cause: ${err.cause}`);
    if (isRpcError(err)) {
      rpcError = { code: err.code, message: err.message };
      const data: Record<string, any> = {};
      if (err.data) {
        warn(`Data: ${err.data}`);
        try {
          data.data = JSON.parse(JSON.stringify(err.data));
        } catch {}
      }
      if (err.cause) {
        try {
          data.cause = JSON.parse(JSON.stringify(err.cause));
        } catch {}
      }
      if (err.stack) data.stack = err.stack;

      if (Object.keys(data).length !== 0) rpcError.data = data;
    } else {
      rpcError = { code: 500, message: errorMessage(err) };
    }
    return rpcError;
  }

  constructor(public code: number, message: string, public data?: any) {
    super(message);
  }
}

export function isRpcError(err: Error): err is RpcError {
  return (err as any).code !== undefined;
}

export function errorMessage(err: any): string {
  if (err instanceof Error) {
    return err.message;
  } else if (typeof err === 'string') {
    return err;
  } else {
    return `Unknown error: ${err}`;
  }
}

export type RpcCallback<T> = (error: jayson.JSONRPCError | null, result?: T) => void;
