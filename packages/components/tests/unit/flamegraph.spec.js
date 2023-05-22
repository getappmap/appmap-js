import { digestEventArray } from '@/lib/flamegraph.js';
import scenario from '@/stories/data/scenario.json';
import { buildAppMap } from '@appland/models';

const accumulateValue = (sum, { value }) => sum + value;

const validateNode = (node) => {
  // children
  expect(node).toHaveProperty('children');
  expect(node.children).toBeInstanceOf(Array);
  node.children.forEach(validateNode);
  // name //
  expect(node).toHaveProperty('name');
  expect(typeof node.name).toBe('string');
  // value //
  expect(node).toHaveProperty('value');
  expect(typeof node.value).toBe('number');
  expect(Number.isInteger(node.value)).toBe(true);
  expect(node.value).toBeGreaterThanOrEqual(node.children.reduce(accumulateValue, 0));
  expect(node.value);
};

describe('digestEventArray', () => {
  it('produce valid flamegraph tree', () => {
    const { events } = buildAppMap(scenario).normalize().build();
    validateNode(digestEventArray(events));
  });
});
