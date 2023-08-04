import { EventEmitter } from 'events';

export type PendingEvent = {
  emitter: EventEmitter;
  event: string;
  args: any[];
};

export const MaxMSBetween = 10 * 1000;

export default class EventAggregator {
  constructor(
    private callback: (events: PendingEvent[]) => Promise<void> | void,
    private maxMsBetween = MaxMSBetween
  ) {
    process.on('beforeExit', () => this.dispose());
  }

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

  private async emitPending() {
    this.timeout = undefined;
    if (this.pending.length) {
      const pendingEvents = this.pending.splice(0, this.pending.length);
      await this.callback(pendingEvents);
    }
  }

  attach(emitter: EventEmitter, event: string) {
    emitter.on(event, (...args) => this.push(emitter, event, args));
  }

  async dispose() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      await this.emitPending();
    }
  }
}
