import { scan } from '../util';
import untrustedDeserializationRule from '../../src/rules/deserializationOfUntrustedData';
import nPlusOneRule from '../../src/rules/nPlusOneQuery';
import tooManyUpdatesRule from '../../src/rules/tooManyUpdates';
import rule from '../../src/rules/tooManyUpdates';

import Check from '../../src/check';
import { loadRule } from '../../src/configuration/configurationProvider';

it('Security Domain in Deserialization of untrusted data', async () => {
  const check = new Check(untrustedDeserializationRule);
  const { findings } = await scan(
    check,
    'appmaps/deserializationOfUntrustedData/unsafe.appmap.json'
  );
  expect(findings).toHaveLength(1);
  expect(findings[0].impactDomain).toEqual('Security');
});

it('Stability Domain in http500', async () => {
  const check = new Check(await loadRule('http-500'));
  const { findings } = await scan(
    check,
    'Password_resets_password_resets_with_http500.appmap.json'
  );
  expect(findings).toHaveLength(1);
  expect(findings[0].impactDomain).toEqual('Stability');
});

it('Performance Domain in n+1 Query', async () => {
  const check = new Check(nPlusOneRule);
  const { findings } = await scan(
    check,
    'Users_profile_profile_display_while_anonyomus.appmap.json'
  );
  expect(findings).toHaveLength(1);
  expect(findings[0].impactDomain).toEqual('Performance');
});

it('Maintainability Domain in Too Many Updates', async () => {
  const options = new rule.Options();
  options.warningLimit = 2;
  const check = new Check(tooManyUpdatesRule, options);
  const { findings } = await scan(
    check,
    'PaymentsController_create_no_user_email_on_file_makes_a_onetime_payment_with_no_user_but_associate_with_stripe.appmap.json'
  );
  expect(findings).toHaveLength(1);
  expect(findings[0].impactDomain).toEqual('Maintainability');
});
