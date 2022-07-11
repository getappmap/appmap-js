import Check from '../../src/check';
import rule from '../../src/rules/jobNotCancelled';
import { scan } from '../util';

test('job not cancelled', async () => {
  const check = new Check(rule);
  const findings = await scan(
    check,
    'Microposts_interface_micropost_interface_with_job.appmap.json'
  );
  expect(findings).toHaveLength(6);
  expect(findings.map((f) => f.event.id)).toEqual([1077, 1093, 1909, 1925, 2049, 2977]);

  const finding = findings[0];
  expect(finding.ruleId).toEqual('job-not-cancelled');
  expect(finding.message).toEqual(
    `Job created by ActiveJob::Enqueuing::ClassMethods.perform_later was not cancelled when the enclosing transaction rolled back`
  );
  expect(Object.keys(finding.participatingEvents!)).toEqual(['beginTransaction']);
  expect(Object.values(finding.participatingEvents!).map((e) => e.sqlQuery)).toEqual([
    'begin transaction',
  ]);
});
