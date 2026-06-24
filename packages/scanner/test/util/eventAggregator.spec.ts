import { EventEmitter } from 'events';
import EventAggregator from '../../src/util/eventAggregator';

describe('EventAggregator', () => {
  it('removes both the event listener and the beforeExit listener when cancelled', () => {
    const baseline = process.listenerCount('beforeExit');
    const emitter = new EventEmitter();

    const aggregator = new EventAggregator(emitter, 'event', () => undefined);
    expect(process.listenerCount('beforeExit')).toBe(baseline + 1);
    expect(emitter.listenerCount('event')).toBe(1);

    aggregator.cancel();
    expect(process.listenerCount('beforeExit')).toBe(baseline);
    expect(emitter.listenerCount('event')).toBe(0);
  });

  it('flushes the pending batch when cancelled', () => {
    const callback = jest.fn();
    const emitter = new EventEmitter();
    const aggregator = new EventAggregator<string>(emitter, 'event', callback);

    emitter.emit('event', 'a');
    emitter.emit('event', 'b');
    expect(callback).not.toHaveBeenCalled(); // still batched, timer not yet fired

    aggregator.cancel();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toEqual(['a', 'b']);
  });

  it('does not invoke the callback when cancelled with nothing pending', () => {
    const callback = jest.fn();
    const emitter = new EventEmitter();
    const aggregator = new EventAggregator<string>(emitter, 'event', callback);

    aggregator.cancel();

    expect(callback).not.toHaveBeenCalled();
  });
});
