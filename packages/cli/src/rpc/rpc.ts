import jayson from 'jayson';

export type RpcHandler<CallT, ResponseT> = {
  name: string;
  handler: (args: CallT) => ResponseT | Promise<ResponseT>;
};

export class RpcError extends Error implements jayson.JSONRPCError {
  static fromException(err: Error): jayson.JSONRPCError {
    let rpcError: jayson.JSONRPCError;
    if (isRpcError(err)) {
      rpcError = { code: err.code, message: err.message, data: err.data };
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
