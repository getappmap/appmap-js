import { EventEmitter } from 'events';

export const MaxMSBetween = 10 * 1000;

export type CancelFn = () => void;

/**
 * Batches the payloads emitted on a single emitter/event, invoking `callback` with the
 * accumulated batch once `maxMsBetween` ms pass without a new event (or at process exit).
 *
 * The emitter is bound at construction and there is exactly one of everything (one event
 * listener, one beforeExit listener), so `cancel()` can always tear down completely —
 * there is no way to half-detach it.
 */
export default class EventAggregator<E> {
  private pending: E[] = [];
  private timeout?: NodeJS.Timeout;

  private readonly onEvent = (event: E): void => {
    this.pending.push(event);
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(this.flush, this.maxMsBetween).unref();
  };

  // Emit the pending batch now. No-op when nothing is pending.
  private readonly flush = (): void => {
    if (!this.timeout) return;
    clearTimeout(this.timeout);
    this.timeout = undefined;
    const batch = this.pending;
    this.pending = [];
    this.callback(batch);
  };

  constructor(
    private readonly emitter: EventEmitter,
    private readonly event: string,
    private readonly callback: (events: E[]) => void,
    private readonly maxMsBetween = MaxMSBetween
  ) {
    emitter.addListener(event, this.onEvent);
    process.on('beforeExit', this.flush);
  }

  // Detach the listeners and emit any final pending batch. Idempotent.
  cancel(): void {
    this.emitter.removeListener(this.event, this.onEvent);
    process.removeListener('beforeExit', this.flush);
    this.flush();
  }
}
