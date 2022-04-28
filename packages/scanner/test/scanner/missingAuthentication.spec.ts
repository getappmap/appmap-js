import Check from '../../src/check';
import rule from '../../src/rules/missingAuthentication';
import { scan } from '../util';

it('missing authentication', async () => {
  const check = new Check(rule);
  const findings = await scan(check, 'Users_profile_profile_display_while_anonyomus.appmap.json');

  expect(findings).toHaveLength(1);
  const finding = findings[0];
  expect(finding.ruleId).toEqual('missing-authentication');
  expect(finding.event.id).toEqual(31);
});
