import Check from '../../src/check';
import rule from '../../src/rules/insecureCompare';
import { scan } from '../util';

it('insecure compare', async () => {
  const findings = await scan(
    new Check(rule),
    'Password_resets_password_resets_with_insecure_compare.appmap.json'
  );
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  expect(finding.ruleId).toEqual('insecure-compare');
  expect(finding.event.id).toEqual(1094);
});
