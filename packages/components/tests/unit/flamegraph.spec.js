import { isEventDurationValid, getEventDuration, styleDimension } from '@/lib/flamegraph.js';

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
