import Check from '../../src/check';
import rule from '../../src/rules/http500';
import { scan } from '../util';

it('http 500', async () => {
  const findings = await scan(
    new Check(rule),
    'Password_resets_password_resets_with_http500.appmap.json'
  );
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  expect(finding.ruleId).toEqual('http-5xx');
  expect(finding.event.id).toEqual(1789);
});
