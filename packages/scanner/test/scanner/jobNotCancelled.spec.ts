import Check from '../../src/check';
import rule from '../../src/rules/jobNotCancelled';
import { scan } from '../util';

test('job not cancelled', async () => {
  const check = new Check(rule);
  const findings = await scan(
    check,
    'Microposts_interface_micropost_interface_with_job.appmap.json'
  );
  expect(findings).toHaveLength(1);
  expect(findings.map((f) => f.event.id)).toEqual([131]);

  const finding = findings[0];
  expect(finding.ruleId).toEqual('job-not-cancelled');
  expect(finding.message).toEqual(
    `6 jobs are scheduled but not cancelled in a rolled back transaction`
  );
});
