import Check from '../../src/check';
import rule from '../../src/rules/circularDependency';
import { scan } from '../util';

const appMapFileName = 'ruby/circular_dependency/tmp/appmap/minitest/Command_command.appmap.json';
const detectCycles = async (check: Check) => {
  return scan(check, appMapFileName);
};

describe('circular dependency', () => {
  it('finds a cycle', async () => {
    const check = new Check(rule);
    check.options.depth = 3;
    const findings = await detectCycles(check);
    expect(findings).toHaveLength(1);
    const finding = findings[0];

    expect(finding.ruleId).toEqual('circular-dependency');
    expect(finding.event.id).toEqual(2);
    expect(finding.message).toEqual(
      `Cycle in package dependency graph: lib/pkg_a -> lib/pkg_b -> lib/pkg_a`
    );
    expect(finding.relatedEvents!.map((e) => e.id)).toEqual([2, 3, 4]);
  });

  it('ignores cycles below the threshold length', async () => {
    const check = new Check(rule);
    check.options.depth = 4;
    const findings = await detectCycles(check);
    expect(findings).toHaveLength(0);
  });
});
