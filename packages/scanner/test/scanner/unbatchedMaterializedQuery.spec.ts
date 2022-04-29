import Check from '../../src/check';
import rule from '../../src/rules/unbatchedMaterializedQuery';
import { scan } from '../util';

it('unbatched materialized query', async () => {
  const findings = await scan(
    new Check(rule),
    'Users_index_index_as_admin_including_pagination_and_delete_links.appmap.json'
  );
  expect(findings.map((finding) => finding.scope.id)).toEqual([1589]);
  expect(findings.map((finding) => finding.event.id).sort()).toEqual([1689]);
  expect(findings.map((finding) => finding.event.sqlQuery!)).toEqual([
    'SELECT "microposts".* FROM "microposts" WHERE "microposts"."user_id" = ? ORDER BY "microposts"."created_at" DESC',
  ]);
});
