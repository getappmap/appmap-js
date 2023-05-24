const PRECISION = 10e6;

// TODO aggregate with codeObject.fqid

const digestEvent = (event) => ({
  name: String(event.toString()),
  value: Number(event.elapsedTime),
  children: event.children.map(digestEvent),
});

const toCompatibleValue = (name, total, value) => {
  if (value < 0) {
    console.warn(`found negative value ${value} for ${name}`);
    return total;
  } else if (total > value) {
    // This happens a lot, not sure why...
    //
    // console.warn(
    //   `had to increase value of ${name} from ${value} to ${total} to match children's total`
    // );
    return total;
  } else {
    return value;
  }
};

const accumulateValue = (sum, { value }) => sum + value;

const validateNode = ({ name, value, children: children1 }) => {
  const children2 = children1.map(validateNode);
  return {
    name,
    value: toCompatibleValue(name, value, children2.reduce(accumulateValue, 0)),
    children: children2,
  };
};

const findMinValue = (min, { value, children }) =>
  children.reduce(findMinValue, value > 0 ? Math.min(min, value) : min);

const computeCommonFactor = (min) => {
  let factor = 1;
  while (min * factor < PRECISION) {
    factor *= 10;
  }
  return factor;
};

const convertValueSample = (node) => {
  const factor = computeCommonFactor(findMinValue(Infinity, node));
  const loop = ({ name, value, children }) => ({
    name,
    value: Math.round(value * factor),
    children: children.map(loop),
  });
  return loop(node);
};

export const digestEventArray = (events) => {
  const children = events.map(digestEvent);
  return convertValueSample(
    validateNode({
      name: 'root',
      value: children.reduce(accumulateValue, 0),
      children,
    })
  );
};
