import Check from '../../src/check';
import { loadRule } from '../../src/configuration/configurationProvider';
import { scan } from '../util';

it('http500', async () => {
  const rule = await loadRule('http500');
  const findings = await scan(
    new Check(rule),
    'Password_resets_password_resets_with_http500.appmap.json'
  );
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  expect(finding.ruleId).toEqual('http-500');
  expect(finding.event.id).toEqual(1789);
});
