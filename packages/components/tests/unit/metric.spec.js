import {
  shiftDecimal,
  toExponential,
  toMetric,
  formatNumberMetric,
  formatNumberExponential,
} from '@/lib/metric.js';
import { parseDecimal, stringifyDecimal } from '../../src/lib/metric';

const testShiftDecimal = (decimal, shift) =>
  stringifyDecimal(shiftDecimal(parseDecimal(decimal), shift));

describe('shiftDecimal', () => {
  it('leaves the decimal intact when shift is 0', () => {
    expect(testShiftDecimal('123.456', 0)).toBe('123.456');
  });
  it('preserves sign', () => {
    expect(testShiftDecimal('-123', 1)).toBe('-1230');
  });
  it('returns 0 when the number is 0', () => {
    expect(testShiftDecimal('0', 1)).toBe('0');
    expect(testShiftDecimal('0', -1)).toBe('0');
  });
  it('shifts the decimal to the right when shift is positive', () => {
    expect(testShiftDecimal('123.456', 1)).toBe('1234.56');
    expect(testShiftDecimal('123.456', 2)).toBe('12345.6');
    expect(testShiftDecimal('123.456', 3)).toBe('123456');
    expect(testShiftDecimal('123.456', 4)).toBe('1234560');
    expect(testShiftDecimal('123.456', 5)).toBe('12345600');
    expect(testShiftDecimal('123.456', 6)).toBe('123456000');
  });
  it('shifts the decimal to the left when shift is negative', () => {
    expect(testShiftDecimal('123.456', -1)).toBe('12.3456');
    expect(testShiftDecimal('123.456', -2)).toBe('1.23456');
    expect(testShiftDecimal('123.456', -3)).toBe('0.123456');
    expect(testShiftDecimal('123.456', -4)).toBe('0.0123456');
    expect(testShiftDecimal('123.456', -5)).toBe('0.00123456');
    expect(testShiftDecimal('123.456', -6)).toBe('0.000123456');
  });
});

// describe('toExponential', () => {
//   it('handles negative or null precision', () => {
//     expect(toExponential(123, -1)).toEqual({
//       coeficient: { sign: '', fract: '', whole: '' },
//       exponent: 0,
//     });
//     expect(toExponential(123, 0)).toEqual({ coeficient: '0', exponent: 0 });
//   });
//   it('handles precision of 1', () => {
//     expect(toExponential(1.23e3, 1)).toEqual({ coeficient: '1', exponent: 3 });
//   });
//   it('handles 0', () => {
//     expect(toExponential(0, 1)).toEqual({ coeficient: '0', exponent: 0 });
//   });
//   it('does not add zeros to fit precision', () => {
//     expect(toExponential(1.23e3, 6)).toEqual({ coeficient: '1.23', exponent: 3 });
//   });
//   it('does round down to precision', () => {
//     expect(toExponential(1.23001e3, 3)).toEqual({ coeficient: '1.23', exponent: 3 });
//   });
//   it('does round up to precision', () => {
//     expect(toExponential(1.23999e3, 3)).toEqual({ coeficient: '1.24', exponent: 3 });
//   });
// });

// describe('toMetric', () => {
//   it('leaves metric exponent intact', () => {
//     expect(toMetric({ coeficient: '1.234', exponent: 0 })).toEqual({
//       coeficient: '1.234',
//       exponent: 0,
//     });
//     expect(toMetric({ coeficient: '1.234', exponent: 3 })).toEqual({
//       coeficient: '1.234',
//       exponent: 3,
//     });
//     expect(toMetric({ coeficient: '1.234', exponent: -3 })).toEqual({
//       coeficient: '1.234',
//       exponent: 6,
//     });
//   });
//   it('shifts decimal to the right on positive exponent', () => {
//     expect(toMetric({ coeficient: '1.234', exponent: 1 })).toEqual({
//       coeficient: '12.34',
//       exponent: 0,
//     });
//     expect(toMetric({ coeficient: '1.234', exponent: 2 })).toEqual({
//       coeficient: '123.4',
//       exponent: 0,
//     });
//   });
//   it('shifts decimal to the right on negative exponent', () => {
//     expect(toMetric({ coeficient: '1.234', exponent: -1 })).toEqual({
//       coeficient: '123.4',
//       exponent: -3,
//     });
//     expect(toMetric({ coeficient: '1.234', exponent: -2 })).toEqual({
//       coeficient: '12.34',
//       exponent: -3,
//     });
//   });
// });

describe('formatNumberMetric', () => {
  it('prints [0, 1e-12[ as 0', () => {
    expect(formatNumberMetric(0, 4)).toBe('0 ');
    expect(formatNumberMetric(0.999123e-12, 4)).toBe('0 ');
  });
  it('prints [1e-3, 1[ in milli', () => {
    expect(formatNumberMetric(1e-3, 4)).toBe('1 m');
    expect(formatNumberMetric(0.999123, 4)).toBe('999.1 m');
  });
  it('prints [1, 1e3[ without prefix', () => {
    expect(formatNumberMetric(1, 4)).toBe('1 ');
    expect(formatNumberMetric(0.999123e3, 4)).toBe('999.1 ');
  });
  it('prints [1e3, 1e6[ in kilo', () => {
    expect(formatNumberMetric(1e3, 4)).toBe('1 k');
    expect(formatNumberMetric(0.999123e6, 4)).toBe('999.1 k');
  });
  it('prints [1e15, infinity[ as +infinity', () => {
    expect(formatNumberMetric(1e15, 4)).toBe('+\u221E ');
  });
  it('prints ]-infinity, 1e15] as -infinity', () => {
    expect(formatNumberMetric(-1e15, 4)).toBe('-\u221E ');
  });
});

describe('formatNumberExponential', () => {
  describe('formatNumberMetric', () => {
    it('handles {0}', () => {
      expect(formatNumberExponential(0, 4)).toBe('0');
    });
    it('prints ]0, 1e-3[ in exponential form', () => {
      expect(formatNumberExponential(1.001234e-6, 5)).toBe('1.0012e-6');
      expect(formatNumberExponential(0.99991234e-3, 5)).toBe('999.91e-6');
    });
    it('prints [1e-3, 1e4[ in decimal form', () => {
      expect(formatNumberExponential(1e-3, 5)).toBe('0.001');
      expect(formatNumberExponential(0.9999123e4, 5)).toBe('9999.1');
    });
    it('prints [1e4, infinity[ in exponential form', () => {
      expect(formatNumberExponential(1e4, 5)).toBe('10e3');
      expect(formatNumberExponential(1e5, 5)).toBe('100e3');
      expect(formatNumberExponential(1e6, 5)).toBe('1e6');
    });
  });
});
