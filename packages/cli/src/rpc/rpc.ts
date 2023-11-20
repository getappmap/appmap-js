export type RpcHandler<CallT, ResponseT> = {
  name: string;
  handler: (args: CallT, callback: RpcCallback<ResponseT>) => void;
};

export type RpcError = {
  code: number;
  message?: string;
};

export type RpcCallback<T> = (error: RpcError | null, result?: T) => void;
