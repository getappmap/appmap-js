/* Malformed JSON fixtures deliberately violate declared payload shapes. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { readFileSync } from 'fs';
import path from 'path';
import { appMapComparisonSchema, validateAppMapComparison } from '../../src/comparison';

const source = path.resolve(__dirname, '../../schema/conformance/targeted-function.json');
const invalid: Record<string, unknown> = {
  nodeType: 2,
  digest: '',
  subtreeDigest: '',
  children: null,
  eventIds: [0],
  elementId: '',
  diffMode: 0,
  elapsed: 'slow',
  formerName: 1,
  formerResult: false,
  movedFrom: { name: '' },
  labels: [1],
  caller: {},
  callee: {},
  name: '',
  static: 0,
  stableProperties: { invalid: [] },
  returnValue: { raisesException: 'false' },
  route: '',
  status: '200',
  query: '',
  count: 0,
};
const valid = {
  count: 2,
  name: 'run',
  route: 'GET /',
  status: 200,
  static: false,
  stableProperties: { flag: false, missing: null, number: 1, text: 'value' },
  returnValue: { raisesException: false, returnValueType: { name: 'User', properties: ['id'] } },
  caller: 'service',
  callee: 'service',
  movedFrom: { name: 'old', actorId: 'service' },
  diffMode: 4,
  elapsed: 0,
  formerName: '',
  formerResult: '',
  labels: [],
  futureExtension: { nested: ['arbitrary', { count: 0 }] },
};
function fixture(nodeType: number) {
  const value = JSON.parse(readFileSync(source, 'utf8'));
  const action = value.views.sequence.diff.rootActions[0];
  Object.assign(action, valid, { nodeType });
  if (nodeType === 6) action.query = 'SELECT 1';
  return { value, action };
}

describe('Given every known serialized sequence action property', () => {
  it('When enumerating adversarial shape cases Then cover every published action property', () => {
    expect(Object.keys(invalid).sort()).toEqual(
      Object.keys(appMapComparisonSchema.$defs.action.properties).sort()
    );
  });
  describe.each([1, 3, 4, 5, 6])('Given valid nodeType %i', (nodeType) => {
    it.each(Object.entries(invalid))(
      'When known property %s has an invalid shape Then reject regardless of node applicability',
      (name, value) => {
        const test = fixture(nodeType);
        test.action[name] = value;
        expect(validateAppMapComparison(test.value).join(' ')).toContain(`.${name}`);
      }
    );
    it('When known properties are valid and unknown extensions are supplied Then accept without mutation', () => {
      const { value } = fixture(nodeType);
      const before = JSON.stringify(value);
      expect(validateAppMapComparison(value)).toEqual([]);
      expect(JSON.stringify(value)).toBe(before);
    });
    it.each([
      null,
      {},
      { raisesException: false, returnValueType: null },
      { raisesException: false, returnValueType: { name: '' } },
      { raisesException: false, returnValueType: { name: 'User', properties: [1] } },
    ])(
      'When returnValue %p is malformed Then reject even on non-function actions',
      (returnValue) => {
        const test = fixture(nodeType);
        test.action.returnValue = returnValue;
        expect(validateAppMapComparison(test.value).join(' ')).toContain('.returnValue');
      }
    );
    it.each([null, {}, { name: 'previous', actorId: 1 }])(
      'When movedFrom %p is malformed Then reject on every node type',
      (movedFrom) => {
        const test = fixture(nodeType);
        test.action.movedFrom = movedFrom;
        expect(validateAppMapComparison(test.value).join(' ')).toContain('.movedFrom');
      }
    );
  });
});
