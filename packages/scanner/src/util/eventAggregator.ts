import { EventEmitter } from 'events';

export type PendingEvent<E> = {
  emitter: EventEmitter;
  event: string;
  arg: E;
};

export const MaxMSBetween = 10 * 1000;

export type CancelFn = () => void;

// TODO: Unify with the code in packages/cli - find a way to make a common import.
export default class EventAggregator<E> {
  private pending: PendingEvent<E>[] = [];
  private timeout?: NodeJS.Timeout;

  constructor(
    private callback: (events: PendingEvent<E>[]) => void,
    private maxMsBetween = MaxMSBetween
  ) {
    process.on('beforeExit', () => {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.emitPending();
      }
    });
  }

  private push(emitter: EventEmitter, event: string, arg: E) {
    this.pending.push({ emitter, event, arg });
    this.refresh();
  }

  private refresh() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(this.emitPending.bind(this), this.maxMsBetween).unref();
  }

  private emitPending() {
    this.callback(this.pending);
    this.timeout = undefined;
    this.pending = [];
  }

  attach(emitter: EventEmitter, event: string): CancelFn {
    const listenerFn = (...args: any[]) => {
      this.push(emitter, event, args[0]);
    };
    emitter.addListener(event, listenerFn);
    return () => emitter.removeListener(event, listenerFn);
  }
}
