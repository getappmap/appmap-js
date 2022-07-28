import HashV2 from '../../src/algorithms/hash/hashV2';
import Check from '../../src/check';
import rule from '../../src/rules/secretInLog';
import { scan } from '../util';

it('secret in log file', async () => {
  const check = new Check(rule);
  const { appMap, findings } = await scan(
    check,
    'Users_signup_valid_signup_information_with_account_activation.appmap.json'
  );
  expect(findings).toHaveLength(2);
  {
    const finding = findings[0];
    const findingEvent = appMap.events.find((e) => e.id === finding.event.id)!;
    expect(
      new HashV2(finding.ruleId, findingEvent, finding.participatingEvents || {}).canonicalString
    ).toEqual(`algorithmVersion=2
rule=secret-in-log
findingEvent.event_type=function
findingEvent.id=Logger::LogDevice#write
findingEvent.raises_exception=false
participatingEvent.generatorEvent.event_type=function
participatingEvent.generatorEvent.id=User.new_token
participatingEvent.generatorEvent.raises_exception=false`);
    expect(finding.ruleId).toEqual('secret-in-log');
    expect(finding.event.id).toEqual(695);
    expect(finding.message).toEqual(
      `Log message contains secret User.new_token "-6SputWUtvALn3TLCfoYvA": [2f025606-b6f0-4b64-8595-006f32f4d5d0] Started GET "/account_activations/-6SputWUtvALn3TLCfoYvA/edit`
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
  const { findings } = await scan(
    check,
    'appmaps/secretInLog/Confirmation_already_confirmed_user_should_not_be_able_to_confirm_the_account_again.appmap.json'
  );
  expect(findings).toHaveLength(3);
  {
    const finding = findings[0];
    expect(finding.ruleId).toEqual('secret-in-log');
    expect(finding.event.id).toEqual(221);
    expect(finding.message).toEqual(
      `Log message contains secret Devise.friendly_token "axzHC1xW-8DtxWrstsJd": REQUESTING PAGE: GET /users/confirmation?confirmation_token=axzHC1xW-8DtxWrstsJd with {} and HTTP he (...9 more characters)`
    );
  }
});
