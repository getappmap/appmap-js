import { EventEmitter } from 'events';

export type PendingEvent<E> = {
  emitter: EventEmitter;
  event: string;
  args: E[];
};

export const MaxMSBetween = 60 * 1000;

// TODO: Unify with the code in packages/cli - find a way to make a common import.
export default class EventAggregator<E> {
  constructor(
    private callback: (events: PendingEvent<E>[]) => void,
    private maxMsBetween = MaxMSBetween
  ) {}

  private pending: PendingEvent<E>[] = [];
  private push(emitter: EventEmitter, event: string, args: E[]) {
    this.pending.push({ emitter, event, args });
    this.refresh();
  }

  private timeout?: NodeJS.Timeout;
  private refresh() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(this.emitPending.bind(this), this.maxMsBetween);
  }

  private emitPending() {
    this.callback(this.pending);
    this.timeout = undefined;
    this.pending = [];
  }

  attach(emitter: EventEmitter, event: string): void {
    emitter.on(event, (...args) => this.push(emitter, event, args));
  }
}
