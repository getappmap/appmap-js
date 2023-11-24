export type RpcHandler<CallT, ResponseT> = {
  name: string;
  handler: (args: CallT) => ResponseT | Promise<ResponseT>;
};

export class RpcError extends Error {
  constructor(public code: number, message?: string) {
    super(message);
  }

  static errorMessage(err: any) {
    if (err instanceof Error) {
      return err.message;
    } else if (typeof err === 'string') {
      return err;
    } else {
      return `Unknown error: ${err}`;
    }
  }
}

export type RpcCallback<T> = (error: RpcError | null, result?: T) => void;
