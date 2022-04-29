import Check from '../../src/check';
import rule from '../../src/rules/tooManyJoins';
import { scan } from '../util';

it('too many joins', async () => {
  const check = new Check(rule);
  check.options.warningLimit = 1;
  const findings = await scan(check, 'Users_profile_profile_display_while_anonyomus.appmap.json');
  expect(findings).toHaveLength(2);
  const finding = findings[0];
  expect(finding.ruleId).toEqual('too-many-joins');
  expect(finding.event.id).toEqual(97);
  expect(finding.message).toEqual(
    '1 join in SQL "SELECT COUNT(*) FROM "users" INNER JOIN "relationships" ON "users"."id" = "relationships"."followed_id" WHERE "relationships"."follower_id" = ?"'
  );
});
