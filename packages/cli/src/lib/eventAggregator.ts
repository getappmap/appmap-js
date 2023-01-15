import { EventEmitter } from 'events';

export type PendingEvent = {
  emitter: EventEmitter;
  event: string;
  args: any[];
};

export const MaxMSBetween = 10 * 1000;

export default class EventAggregator {
  constructor(
    private callback: (events: PendingEvent[]) => void,
    private maxMsBetween = MaxMSBetween
  ) {
    process.on('beforeExit', this.finish);
  }

  private pending: PendingEvent[] = [];
  private push(emitter: EventEmitter, event: string, args: any[]) {
    this.pending.push({ emitter, event, args });
    this.refresh();
  }

  private timeout?: NodeJS.Timeout;
  private refresh() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(this.emitPending.bind(this), this.maxMsBetween).unref();
  }

  private emitPending() {
    this.callback(this.pending);
    this.timeout = undefined;
    this.pending = [];
  }

  attach(emitter: EventEmitter, event: string) {
    emitter.on(event, (...args) => this.push(emitter, event, args));
  }

  // Note: do not be tempted to tranform this to a named function.
  // This needs to be an arrow function bound to the instance.
  public readonly finish = () => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.emitPending();
    }
    process.removeListener('beforeExit', this.finish);
  };
}
