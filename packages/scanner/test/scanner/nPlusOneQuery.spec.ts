import Check from '../../src/check';
import rule from '../../src/rules/nPlusOneQuery';
import { scan } from '../util';

it('n+1 query', async () => {
  const check = new Check(rule);
  const findings = await scan(check, 'Users_profile_profile_display_while_anonyomus.appmap.json');

  expect(findings).toHaveLength(1);
  // It's important that there is only one finding, since the query repeats 30 times.
  // That's one finding; not 30 findings.
  const finding1 = findings[0];
  expect(finding1.appMapName).toEqual('Users_profile profile display while anonyomus');
  expect(finding1.ruleId).toEqual('n-plus-one-query');
  expect(finding1.event.id).toEqual(133);
  expect(finding1.relatedEvents!).toHaveLength(30);
  expect(finding1.message).toEqual(
    `30 occurrences of SQL: SELECT "active_storage_attachments".* FROM "active_storage_attachments" WHERE "active_storage_attachments"."record_id" = ? AND "active_storage_attachments"."record_type" = ? AND "active_storage_attachments"."name" = ? LIMIT ?`
  );
});
