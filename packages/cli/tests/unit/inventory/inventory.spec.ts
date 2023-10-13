import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

import { handler } from '../../../src/cmds/inventory/inventory';
import { cleanProject, fixtureDir } from '../util';
import { debug } from 'console';
import { Report } from '../../../src/cmds/inventory/Report';
import { ImpactDomain } from '@appland/scanner';

const projectDir = path.join(fixtureDir, 'compare/.appmap/change-report/all-succeeded/base');

describe('inventory command', () => {
  afterEach(async () => {
    await cleanProject(projectDir);
  });

  it('creates the expected inventory report', async () => {
    const outputFile = path.join(projectDir, 'inventory.json');
    await handler({
      directory: projectDir,
      appmapDir: '.',
      outputFile: 'inventory.json',
      resourceTokens: 2,
      findingLimit: 3,
    });
    assert(existsSync(outputFile));
    const actualReport: Report = JSON.parse(readFileSync(outputFile, 'utf-8'));

    expect(actualReport.appmapCountByRecorderName).toEqual({ minitest: 6 });
    expect(actualReport.appmapCountByHTTPServerRequestCount).toEqual({
      '0': 1,
      '1': 1,
      '3': 1,
      '5': 2,
      '6': 1,
    });
    expect(Object.keys(actualReport.routeCountByResource)).toContain('/account_activations/{id}');
    expect(actualReport.sqlTables).toContain('microposts');
    expect(actualReport.findingCountByImpactDomain).toEqual({
      Performance: 8,
      Security: 6,
      Maintainability: 2,
    });
    expect(actualReport.findings).toHaveLength(3);
    expect(actualReport.findings.map((f) => f.impactDomain)).toEqual([
      'Security',
      'Performance',
      'Maintainability',
    ]);
  });
});
