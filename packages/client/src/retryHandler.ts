import { IncomingMessage } from 'http';

export type ResolveFunction = (value: IncomingMessage | PromiseLike<IncomingMessage>) => void;
export type RejectFunction = (reason?: Error) => void;

export type RetryHandler = (resolve: ResolveFunction, reject: RejectFunction) => void;
