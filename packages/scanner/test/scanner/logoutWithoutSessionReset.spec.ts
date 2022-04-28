import Check from '../../src/check';
import rule from '../../src/rules/logoutWithoutSessionReset';
import { scan } from '../util';

test('logout without session reset', async () => {
  const check = new Check(rule);
  const findings = await scan(
    check,
    'Users_login_login_with_valid_information_followed_by_logout.appmap.json'
  );
  expect(findings).toHaveLength(1);
  expect(findings[0].event.codeObject.fqid).toEqual(
    'function:app/controllers/SessionsController#destroy'
  );
});
