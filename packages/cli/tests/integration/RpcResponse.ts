export type RpcResponse<T> = {
  error?: { code: number; message: string };
  id: number;
  jsonrpc: string;
  result?: T;
};
