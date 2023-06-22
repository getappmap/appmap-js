const metrics = new Map([
  [-12, 'p'],
  [-9, 'n'],
  [-6, 'µ'],
  [-3, 'm'],
  [0, ''],
  [3, 'k'],
  [6, 'M'],
  [9, 'G'],
  [12, 'T'],
]);

/////////////
// Decimal //
/////////////

// Unfortunately, we need this format to prevent floating point errors.
// For instance: parseFloat('1.234') * 1e-15 * 1e15 === 1.2340000000000002

export const parseDecimal = (string) => {
  const [whole, fract = ''] = string.replace(/^-/, '').split('.');
  return { sign: string[0] === '-' ? '-' : '', whole, fract };
};

export const stringifyDecimal = ({ sign, whole, fract }) =>
  `${sign}${/^0*$/.test(whole) ? '0' : whole.replace(/^0*/, '')}${
    /^0*$/.test(fract) ? '' : `.${fract.replace(/0*$/, '')}`
  }`;

export const shiftDecimal = (decimal, shift) => {
  if (shift === 0) {
    return decimal;
  } else {
    const { sign, whole, fract } = decimal;
    if (shift > 0) {
      const padded_fract = fract.padEnd(shift, '0');
      return {
        sign,
        whole: `${whole}${padded_fract.substring(0, shift)}`,
        fract: padded_fract.substring(shift),
      };
    } else {
      const padded_whole = whole.padStart(-shift, '0');
      return {
        sign,
        whole: padded_whole.substring(0, padded_whole.length + shift),
        fract: `${padded_whole.substring(padded_whole.length + shift) + fract}`,
      };
    }
  }
};

/////////////////
// Exponential //
/////////////////

export const toExponential = (number, precision) => {
  if (precision <= 0) {
    return {
      coeficient: { sign: '', whole: '', fract: '' },
      exponent: 0,
    };
  } else {
    const [coeficient, exponent] = number.toExponential(precision - 1).split('e');
    return {
      coeficient: parseDecimal(coeficient),
      exponent: parseInt(exponent),
    };
  }
};

export const toMetric = ({ coeficient, exponent }) => {
  let rest = exponent % 3;
  if (rest < 0) {
    rest += 3;
  }
  return {
    coeficient: shiftDecimal(coeficient, rest),
    exponent: exponent - rest,
  };
};

//////////////////
// formatNumber //
//////////////////

export const formatNumberMetric = (number, precision) => {
  const { coeficient, exponent } = toMetric(toExponential(number, precision));
  if (metrics.has(exponent)) {
    return `${stringifyDecimal(coeficient)} ${metrics.get(exponent)}`;
  } else {
    return exponent > 0 ? `${number > 0 ? '+' : '-'}\u221E ` : '0 ';
  }
};

export const formatNumberExponential = (number, precision) => {
  const { coeficient, exponent } = toExponential(number, precision);
  if (exponent >= -3 && exponent <= 3) {
    return stringifyDecimal(shiftDecimal(coeficient, exponent));
  } else {
    const { coeficient: metric_coeficient, exponent: metric_exponent } = toMetric({
      coeficient,
      exponent,
    });
    return `${stringifyDecimal(metric_coeficient)}e${metric_exponent}`;
  }
};
