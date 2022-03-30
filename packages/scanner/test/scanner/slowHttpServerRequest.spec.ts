import Check from '../../src/check';
import rule from '../../src/rules/slowHttpServerRequest';
import { scan } from '../util';

it('slow HTTP server request', async () => {
  const options = new rule.Options();
  options.timeAllowed = 0.5;
  const findings = await scan(
    new Check(rule, options),
    'Password_resets_password_resets.appmap.json'
  );
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  expect(finding.ruleId).toEqual('slow-http-server-request');
  expect(finding.event.id).toEqual(411);
  expect(finding.ruleTitle).toEqual('Slow HTTP server request');
  expect(finding.message).toEqual('Slow HTTP server request (> 500ms)');
  expect(finding.hash).toEqual('bbc083963fa83499c1f98d18739e95213a492d624df914a2b18e04978db2bf12');
});
