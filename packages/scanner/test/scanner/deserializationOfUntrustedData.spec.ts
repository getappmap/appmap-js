import HashV2 from '../../src/algorithms/hash/hashV2';
import Check from '../../src/check';
import rule from '../../src/rules/deserializationOfUntrustedData';
import { scan } from '../util';

test('unsafe deserialization', async () => {
  const check = new Check(rule);
  const { appMap, findings } = await scan(
    check,
    'appmaps/deserializationOfUntrustedData/unsafe.appmap.json'
  );
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  const findingEvent = appMap.events.find((e) => e.id === finding.event.id)!;
  expect(
    new HashV2(finding.ruleId, findingEvent, finding.participatingEvents || {}).canonicalString
  ).toEqual(`algorithmVersion=2
rule=deserialization-of-untrusted-data
findingEvent.event_type=function
findingEvent.id=psych/Psych.load
findingEvent.raises_exception=false
participatingEvent.origin[0][0].event_type=function
participatingEvent.origin[0][0].id=ruby/String#unpack1
participatingEvent.origin[0][0].raises_exception=false
participatingEvent.origin[0][1].event_type=http_server_request
participatingEvent.origin[0][1].route=GET /password_resets/{id}/edit
participatingEvent.origin[0][1].status_code=302
stack[1].event_type=http_server_request
stack[1].route=GET /password_resets/{id}/edit
stack[1].status_code=302`);
  expect(finding.event.codeObject.fqid).toEqual('function:psych/Psych.load');
});

test('unsafe deserialization in a safe function', async () => {
  const check = new Check(rule);
  const { findings } = await scan(check, 'appmaps/deserializationOfUntrustedData/safe.appmap.json');
  expect(findings).toHaveLength(0);
});

test('unsafe deserialization from untainted source', async () => {
  const check = new Check(rule);
  const { findings } = await scan(
    check,
    'appmaps/deserializationOfUntrustedData/untainted.appmap.json'
  );
  expect(findings).toHaveLength(0);
});

test('unsafe deserialization after sanitization', async () => {
  const check = new Check(rule);
  const { findings } = await scan(
    check,
    'appmaps/deserializationOfUntrustedData/sanitized.appmap.json'
  );
  expect(findings).toHaveLength(0);
});

test('unsafe deserialization after sanitization predicate', async () => {
  const check = new Check(rule);
  const { findings } = await scan(
    check,
    'appmaps/deserializationOfUntrustedData/sanitized-predicate.appmap.json'
  );
  expect(findings).toHaveLength(0);
});
