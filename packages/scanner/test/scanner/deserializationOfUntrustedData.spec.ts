import HashV2 from '../../src/algorithms/hash/hashV2';
import Check from '../../src/check';
import rule from '../../src/rules/deserializationOfUntrustedData';
import { scan } from '../util';

test('unsafe deserialization', async () => {
  const check = new Check(rule);
  const { appMap, findings } = await scan(
    check,
    'appmaps/deserializationOfUntrustedData/Users_index_index_as_non-admin.appmap.json'
  );
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  const findingEvent = appMap.events.find((e) => e.id === finding.event.id)!;
  expect(
    new HashV2(finding.ruleId, findingEvent, finding.participatingEvents || {}).canonicalString
  ).toEqual(`algorithmVersion=2
rule=deserialization-of-untrusted-data
findingEvent.event_type=function
findingEvent.id=ActiveSupport::MarshalWithAutoloading.load
findingEvent.raises_exception=false
stack[1].event_type=function
stack[1].id=app_views_users_index_html_erb.render
stack[1].raises_exception=false
stack[2].event_type=function
stack[2].id=ActionController::Instrumentation#process_action
stack[2].raises_exception=false
stack[3].event_type=http_server_request
stack[3].route=GET /users
stack[3].status_code=200`);
  expect(finding.event.codeObject.fqid).toEqual(
    'function:marshal/ActiveSupport::MarshalWithAutoloading.load'
  );
});
