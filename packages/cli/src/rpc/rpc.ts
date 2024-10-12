import type jayson from 'jayson';

export type RpcHandler<CallT, ResponseT> = {
  name: string | string[];
  handler: (args: CallT) => ResponseT | Promise<ResponseT>;
};

export class RpcError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

export function toJaysonRpcError(error: unknown): jayson.JSONRPCError {
  const rpcError: jayson.JSONRPCError = { code: 500, message: errorMessage(error) };
  if (error && typeof error === 'object') {
    if ('code' in error && typeof error.code === 'number') rpcError.code = error.code;
    const data: Record<string, unknown> = {};
    if ('data' in error)
      try {
        data.data = JSON.parse(JSON.stringify(error.data));
      } catch {
        // fallthrough
      }
    if ('cause' in error)
      try {
        data.cause = JSON.parse(JSON.stringify(error.cause));
      } catch {
        // fallthrough
      }
    if ('stack' in error) data.stack = error.stack;

    if (Object.keys(data).length !== 0) rpcError.data = data;
  }
  return rpcError;
}

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  )
    return error.message;
  return String(error);
}

export type RpcCallback<T> = (error: jayson.JSONRPCError | null, result?: T) => void;
