import Check from '../../src/check';
import rule from '../../src/rules/secretInLog';
import { scan } from '../util';

it('secret in log file', async () => {
  const check = new Check(rule);
  const findings = await scan(
    check,
    'Users_signup_valid_signup_information_with_account_activation.appmap.json'
  );
  expect(findings).toHaveLength(2);
  {
    const finding = findings[0];
    expect(finding.ruleId).toEqual('secret-in-log');
    expect(finding.event.id).toEqual(695);
    expect(finding.message).toEqual(
      `[2f025606-b6f0-4b64-8595-006f32f4d5d0] Started GET "/account_activations/-6SputWUtvALn3TLCfoYvA/edit contains secret -6SputWUtvALn3TLCfoYvA`
    );
  }
  {
    const finding = findings[1];
    expect(finding.ruleId).toEqual('secret-in-log');
    expect(finding.event.id).toEqual(817);
  }
});

it('parses out multiple secrets from function return value', async () => {
  const check = new Check(rule);
  const findings = await scan(
    check,
    'appmaps/secretInLog/Confirmation_already_confirmed_user_should_not_be_able_to_confirm_the_account_again.appmap.json'
  );
  expect(findings).toHaveLength(3);
  {
    const finding = findings[0];
    expect(finding.ruleId).toEqual('secret-in-log');
    expect(finding.event.id).toEqual(221);
    expect(finding.message).toEqual(
      `REQUESTING PAGE: GET /users/confirmation?confirmation_token=axzHC1xW-8DtxWrstsJd with {} and HTTP he (...9 more characters) contains secret axzHC1xW-8DtxWrstsJd`
    );
  }
});
