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
  expect(finding.hash).toEqual('c34836c5dc38a527f7a6d6c4867d60e7c8af09a3498735bb83746157d456b8a2');
});
