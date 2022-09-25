import HashV2 from '../../src/algorithms/hash/hashV2';
import Check from '../../src/check';
import rule from '../../src/rules/nPlusOneQuery';
import { scan } from '../util';

const EXPECTED_HASH = '85e714418ac26ab2ed674c83d9031766976b4a5f9047d0b462b781651334ad7c';

it('n+1 query', async () => {
  const check = new Check(rule);
  const { appMap, findings } = await scan(
    check,
    'Users_profile_profile_display_while_anonyomus.appmap.json'
  );

  expect(findings).toHaveLength(1);
  // It's important that there is only one finding, since the query repeats 30 times.
  // That's one finding; not 30 findings.
  const finding = findings[0];
  const findingEvent = appMap.events.find((e) => e.id === finding.event.id)!;
  expect(
    new HashV2(finding.ruleId, findingEvent, finding.participatingEvents || {}).canonicalString
  ).toEqual(`algorithmVersion=2
rule=n-plus-one-query
findingEvent.event_type=sql
findingEvent.sql_normalized={"type":"statement","variant":"list","statement":[{"type":"statement","variant":"select","result":[{"type":"identifier","variant":"star","name":"active_storage_attachments.*"}],"from":{"type":"identifier","variant":"table","name":"active_storage_attachments"},"where":[{"type":"expression","format":"binary","variant":"operation","operation":"and","left":{"type":"expression","format":"binary","variant":"operation","operation":"and","left":{"type":"expression","format":"binary","variant":"operation","operation":"=","left":{"type":"identifier","variant":"column","name":"active_storage_attachments.record_id"},"right":{"type":"variable"}},"right":{"type":"expression","format":"binary","variant":"operation","operation":"=","left":{"type":"identifier","variant":"column","name":"active_storage_attachments.record_type"},"right":{"type":"variable"}}},"right":{"type":"expression","format":"binary","variant":"operation","operation":"=","left":{"type":"identifier","variant":"column","name":"active_storage_attachments.name"},"right":{"type":"variable"}}}],"limit":{"type":"expression","variant":"limit","start":{"type":"variable"}}}]}
participatingEvent.commonAncestor.event_type=function
participatingEvent.commonAncestor.id=app/views/app_views_microposts__micropost_html_erb.render
participatingEvent.commonAncestor.raises_exception=false
stack[1].event_type=function
stack[1].id=app/views/app_views_users_show_html_erb.render
stack[1].raises_exception=false
stack[2].event_type=function
stack[2].id=actionpack/ActionController::Instrumentation#process_action
stack[2].raises_exception=false
stack[3].event_type=http_server_request
stack[3].route=GET /users/{id}
stack[3].status_code=200`);
  expect(finding.ruleId).toEqual('n-plus-one-query');
  expect(finding.event.id).toEqual(133);
  expect(finding.relatedEvents!).toHaveLength(31);
  expect(finding.hash).toEqual(EXPECTED_HASH);
  expect(finding.message).toEqual(
    `app_views_microposts__micropost_html_erb.render[120] contains 30 occurrences of SQL: SELECT "active_storage_attachments".* FROM "active_storage_attachments" WHERE "active_storage_attachments"."record_id" = ? AND "active_storage_attachments"."record_type" = ? AND "active_storage_attachments"."name" = ? LIMIT ?`
  );
  expect(Object.keys(finding.participatingEvents!)).toEqual(['commonAncestor']);
});

it('takes into account only unique hashes of related events when computing hash', async () => {
  const check = new Check(rule);
  const { findings } = await scan(
    check,
    'Users_profile_profile_display_while_anonyomus_29_events.appmap.json'
  );

  const finding1 = findings[0];
  expect(finding1.relatedEvents!).toHaveLength(30);
  expect(finding1.hash).toEqual(EXPECTED_HASH);
});
