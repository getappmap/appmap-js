export interface DoneCallback {
  (...args: any[]): any;
  fail(error?: string | { message: string }): any;
}

export type ProvidesCallback =
  | ((cb: DoneCallback) => void | undefined)
  | (() => Promise<unknown>);
