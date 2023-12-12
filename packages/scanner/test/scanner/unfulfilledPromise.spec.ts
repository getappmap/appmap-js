import Check from '../../src/check';
import rule from '../../src/rules/unfulfilledPromise';
import { scan } from '../util';

test('unfulfilled promise', async () => {
  const { findings } = await scan(new Check(rule), 'unfulfilled-promise.appmap.json');
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  expect(finding.ruleId).toEqual('unfulfilled-promise');
  expect(finding.event.id).toEqual(1);
});
