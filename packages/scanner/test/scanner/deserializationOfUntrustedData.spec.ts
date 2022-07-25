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
  ).toEqual(`rule=deserialization-of-untrusted-data
commandEvent.event_type=http_server_request
commandEvent.route=GET /users
commandEvent.status_code=200
findingEvent.event_type=function
findingEvent.id=ActiveSupport::MarshalWithAutoloading.load
findingEvent.raises_exception=false`);
  expect(finding.event.codeObject.fqid).toEqual(
    'function:marshal/ActiveSupport::MarshalWithAutoloading.load'
  );
});
