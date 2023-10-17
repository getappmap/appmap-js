import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

import { handler } from '../../../src/cmds/inventory/inventory';
import { cleanProject, fixtureDir } from '../util';
import { Report } from '../../../src/cmds/inventory/Report';

const originalWorkingDir = process.cwd();
const projectDir = path.join(fixtureDir, 'inventory');

describe('inventory command', () => {
  afterEach(async () => await cleanProject(projectDir));
  afterEach(async () => process.chdir(originalWorkingDir));

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
      '1': 1,
      '3': 2,
      '5': 2,
      '6': 1,
    });
    expect(Object.keys(actualReport.routeCountByResource)).toContain('/account_activations/{id}');
    expect(actualReport.sqlTables).toContain('microposts');
  });
});
