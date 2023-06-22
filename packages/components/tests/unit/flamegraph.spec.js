import {
  isEventDurationValid,
  getEventDuration,
  formatDurationMillisecond,
  formatDuration,
  styleDimension,
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

describe('styleDimension', () => {
  it('throws an error if height is too small', () => {
    expect(() => styleDimension({ width: 10, height: 20 }, { border: 0, padding: 15 })).toThrow();
    expect(() => styleDimension({ width: 10, height: 20 }, { border: 15, padding: 0 })).toThrow();
  });
  it('honor border and padding when possible', () => {
    expect(styleDimension({ width: 10, height: 20 }, { border: 2, padding: 3 })).toEqual({
      width: '10px',
      height: '20px',
      'padding-left': '3px',
      'padding-right': '3px',
      'padding-bottom': '3px',
      'padding-top': '3px',
      'border-left-width': '2px',
      'border-right-width': '2px',
      'border-top-width': '2px',
      'border-bottom-width': '2px',
    });
  });
  it('shrink border and padding when restricted', () => {
    expect(styleDimension({ width: 1, height: 20 }, { border: 2, padding: 3 })).toEqual({
      width: '1px',
      height: '20px',
      'padding-left': '0px',
      'padding-right': '0px',
      'padding-bottom': '3px',
      'padding-top': '3px',
      'border-left-width': '1px',
      'border-right-width': '0px',
      'border-top-width': '2px',
      'border-bottom-width': '2px',
    });
  });
});
