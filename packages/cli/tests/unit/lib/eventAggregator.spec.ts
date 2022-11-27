import EventEmitter from 'events';
import EventAggregator, { MaxMSBetween } from '../../../src/lib/eventAggregator';
jest.useFakeTimers();

describe(EventAggregator, () => {
  const emitter = new EventEmitter();
  const fn = jest.fn();
  const aggregator = new EventAggregator(fn);
  aggregator.attach(emitter, 'sing');
  aggregator.attach(emitter, 'dance');

  beforeEach(() => {
    fn.mockReset();
  });

  it('aggregates events in the given timeframe', () => {
    emitter.emit('sing', 80, 'song');
    jest.advanceTimersByTime(MaxMSBetween / 2);
    emitter.emit('dance', 'like there is no tomorrow');
    jest.advanceTimersByTime(MaxMSBetween / 2);
    emitter.emit('sing', 'in the rain');
    jest.advanceTimersByTime(MaxMSBetween * 1.2);

    expect(fn.mock.calls).toEqual([
      [
        [
          { emitter, event: 'sing', args: [80, 'song'] },
          { emitter, event: 'dance', args: ['like there is no tomorrow'] },
          { emitter, event: 'sing', args: ['in the rain'] },
        ],
      ],
    ]);
  });

  it('calls the callback separately between timeframes', () => {
    emitter.emit('sing', 80, 'song');
    jest.advanceTimersByTime(MaxMSBetween / 2);
    emitter.emit('dance', 'like there is no tomorrow');
    jest.advanceTimersByTime(MaxMSBetween * 1.2);
    emitter.emit('sing', 'in the rain');
    jest.advanceTimersByTime(MaxMSBetween * 1.2);

    expect(fn.mock.calls).toEqual([
      [
        [
          { emitter, event: 'sing', args: [80, 'song'] },
          { emitter, event: 'dance', args: ['like there is no tomorrow'] },
        ],
      ],
      [[{ emitter, event: 'sing', args: ['in the rain'] }]],
    ]);
  });
});
