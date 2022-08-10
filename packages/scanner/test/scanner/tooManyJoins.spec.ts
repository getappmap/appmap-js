import Check from '../../src/check';
import { loadRule } from '../../src/configuration/configurationProvider';
import { scan } from '../util';

describe('too many joins', () => {
  it('matches', async () => {
    const rule = await loadRule('too-many-joins');
    const check = new Check(rule);
    check.options.warningLimit = 1;
    const { findings } = await scan(
      check,
      'Users_profile_profile_display_while_anonyomus.appmap.json'
    );
    expect(findings).toHaveLength(2);
    const finding = findings[0];
    expect(finding.ruleId).toEqual('too-many-joins');
    expect(finding.event.id).toEqual(97);
    expect(finding.message).toEqual(
      '1 join in SQL "SELECT COUNT(*) FROM "users" INNER JOIN "relationships" ON "users"."id" = "relationships"."followed_id" WHERE "relationships"."follower_id" = ?"'
    );
  });
  it('matches pg_* tables if the filter is disabled', async () => {
    const rule = await loadRule('too-many-joins');
    const check = new Check(rule);
    check.options.excludeTables = [];
    const { findings } = await scan(
      check,
      'appmaps/tooManyJoins/ScannerFinding_for_check_returns_all_findings_for_a_particular_check.appmap.json'
    );
    expect(findings).toHaveLength(1);
  });
  it('ignores pg_* tables', async () => {
    const rule = await loadRule('too-many-joins');
    const check = new Check(rule);
    const { findings } = await scan(
      check,
      'appmaps/tooManyJoins/ScannerFinding_for_check_returns_all_findings_for_a_particular_check.appmap.json'
    );
    expect(findings).toHaveLength(0);
  });
});
