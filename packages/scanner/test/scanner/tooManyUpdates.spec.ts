import Check from '../../src/check';
import rule from '../../src/rules/tooManyUpdates';
import { scan } from '../util';

it('too many updates', async () => {
  const options = new rule.Options();
  options.warningLimit = 2;
  const findings = await scan(
    new Check(rule, options),
    'PaymentsController_create_no_user_email_on_file_makes_a_onetime_payment_with_no_user_but_associate_with_stripe.appmap.json'
  );
  expect(findings).toHaveLength(1);
  // It's important that there is only one finding, since the query repeats 30 times.
  // That's one finding; not 30 findings.
  const finding1 = findings[0];
  expect(finding1.ruleId).toEqual('too-many-updates');
  expect(finding1.event.id).toEqual(89);
  expect(finding1.message).toEqual(`Command performs 3 SQL and RPC updates`);
  expect(finding1.relatedEvents!).toHaveLength(3);
});
