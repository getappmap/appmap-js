import {
  isEventDurationValid,
  getEventDuration,
  formatDurationMillisecond,
  formatDuration,
} from '@/lib/flamegraph.js';

describe('isEventDurationValid', () => {
  it('returns true for event with positive duration', () => {
    expect(isEventDurationValid({ elapsedTime: 123 })).toBe(true);
  });
  it('returns true for event with 0 duration', () => {
    expect(isEventDurationValid({ elapsedTime: 0 })).toBe(true);
  });
  it('returns false for event with negative duration', () => {
    expect(isEventDurationValid({ elapsedTime: -123 })).toBe(false);
  });
  it('returns false for event with NaN duration', () => {
    expect(isEventDurationValid({ elapsedTime: NaN })).toBe(false);
  });
  it('returns false for event with duration of wrong type', () => {
    expect(isEventDurationValid({ elapsedTime: '123' })).toBe(false);
  });
});

describe('getEventDuration', () => {
  it('returns 0 for event with invalid duration', () => {
    expect(getEventDuration({ elapsedTime: -123 })).toBe(0);
    expect(getEventDuration({ elapsedTime: NaN })).toBe(0);
    expect(getEventDuration({ elapsedTime: '123' })).toBe(0);
  });
  it('returns the duration for event with valid duration', () => {
    expect(getEventDuration({ elapsedTime: 123 })).toBe(123);
  });
});

describe('formatDurationMillisecond', () => {
  it('returns "unknown" for invalid duration', () => {
    expect(formatDurationMillisecond(-123, 2)).toBe('unknown');
    expect(formatDurationMillisecond(0, 2)).toBe('unknown');
    expect(formatDurationMillisecond(NaN, 2)).toBe('unknown');
  });
  it('returns a decimal format for nearby range', () => {
    expect(formatDurationMillisecond(1e-3 * 1.234e-3, 2)).toBe('0.0012 ms');
    expect(formatDurationMillisecond(1e-3 * 1.234, 2)).toBe('1.2 ms');
    expect(formatDurationMillisecond(1e-3 * 1.234e3, 2)).toBe('1200 ms');
  });
  it('returns an exponential format for distant range', () => {
    expect(formatDurationMillisecond(1e-3 * 1.234e6, 2)).toBe('1.2e6 ms');
    expect(formatDurationMillisecond(1e-3 * 1.234e-6, 2)).toBe('1.2e-6 ms');
  });
});

describe('formatDuration', () => {
  it('returns "unknown" for invalid duration', () => {
    expect(formatDuration(-123)).toBe('unknown');
    expect(formatDuration(0)).toBe('unknown');
    expect(formatDuration(NaN)).toBe('unknown');
  });
  it('returns a metric format', () => {
    expect(formatDuration(1.234e-6, 2)).toBe('1.2 µs');
    expect(formatDuration(1.234e-3, 2)).toBe('1.2 ms');
    expect(formatDuration(1.234, 2)).toBe('1.2 s');
    expect(formatDuration(1.234e3, 2)).toBe('1.2 ks');
  });
});
