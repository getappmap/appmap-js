import Check from '../../src/check';
import rule from '../../src/rules/incompatibleHttpClientRequest';
import { scan } from '../util';
import { join, normalize } from 'path';
import { cwd } from 'process';

it('incompatible http client requests', async () => {
  const railsSampleAppSchemaURL = `file://${normalize(
    join(cwd(), 'test', 'fixtures', 'schemata', 'railsSampleApp6thEd.openapiv3.yaml')
  )}`;
  const check = new Check(rule);
  check.options.schemata = { 'api.stripe.com': railsSampleAppSchemaURL };
  const findings = await scan(
    check,
    'PaymentsController_create_no_user_email_on_file_makes_a_onetime_payment_with_no_user_but_associate_with_stripe.appmap.json'
  );
  expect(findings).toHaveLength(4);
  const finding = findings[0];
  expect(finding.event.id).toEqual(19);
  expect(finding.message).toEqual(
    `HTTP client request is incompatible with OpenAPI schema. Change details: remove paths./v1/tokens`
  );
});
