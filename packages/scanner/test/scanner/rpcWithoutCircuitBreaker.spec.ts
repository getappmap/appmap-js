import Check from '../../src/check';
import rule from '../../src/rules/rpcWithoutCircuitBreaker';
import { scan } from '../util';

it('rpc without circuit breaker', async () => {
  const findings = await scan(
    new Check(rule),
    'PaymentsController_create_no_user_email_on_file_makes_a_onetime_payment_with_no_user_but_associate_with_stripe.appmap.json'
  );
  expect(findings).toHaveLength(4);
  const finding = findings[0];
  expect(finding.ruleId).toEqual('rpc-without-circuit-breaker');
  expect(finding.event.id).toEqual(19);
});

it('all rpc have a circuit breaker ', async () => {
  const findings = await scan(
    new Check(rule),
    'Test_net_5xxs_trip_circuit_when_fatal_server_flag_enabled.appmap.json'
  );
  expect(findings).toHaveLength(0);
});
