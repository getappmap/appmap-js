import circularDependency from '../../src/scanner/circularDependency';
import type { ScopeName } from '../../src/types';
import { makePrototype, scan } from '../util';

const { scope, enumerateScope, scanner, Options } = circularDependency;
const options = new Options();
const appMapFileName = 'ruby/circular_dependency/tmp/appmap/minitest/Command_command.appmap.json';
const detectCycles = async () => {
  return scan(
    makePrototype(
      'circular-dependency',
      () => scanner(options),
      enumerateScope,
      scope as ScopeName
    ),
    appMapFileName
  );
};

describe('circular dependency scanner', () => {
  it('finds a cycle', async () => {
    options.depth = 3;
    const findings = await detectCycles();
    expect(findings).toHaveLength(1);
    const finding = findings[0];

    expect(finding.scannerId).toEqual('circular-dependency');
    expect(finding.event.id).toEqual(2);
    expect(finding.message).toEqual(
      `Cycle in package dependency graph: lib/pkg_a -> lib/pkg_b -> lib/pkg_a`
    );
    expect(finding.relatedEvents!.map((e) => e.id)).toEqual([2, 3, 4]);
  });

  it('ignores cycles below the threshold length', async () => {
    options.depth = 4;
    const findings = await detectCycles();
    expect(findings).toHaveLength(0);
  });
});
