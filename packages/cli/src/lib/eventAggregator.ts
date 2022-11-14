import { EventEmitter } from 'events';

export type PendingEvent = {
  emitter: EventEmitter;
  event: string;
  args: any[];
};

export const MaxMSBetween = 1000;

export default class EventAggregator {
  constructor(
    private callback: (events: PendingEvent[]) => void,
    private maxMsBetween = MaxMSBetween
  ) {}

  private pending: PendingEvent[] = [];
  private push(emitter: EventEmitter, event: string, args: any[]) {
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

  attach(emitter: EventEmitter, event: string) {
    emitter.on(event, (...args) => this.push(emitter, event, args));
  }
}
