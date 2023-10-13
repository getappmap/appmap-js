import path, { join } from 'path';

import { handler } from '../../../src/cmds/inventory-report/inventoryReport';
import { cleanProject, fixtureDir } from '../util';
import verifyReportContents from '../compareReport/verifyReportContents';

const originalWorkingDir = process.cwd();
const projectDir = path.join(fixtureDir, 'inventory');

describe('inventory-report command', () => {
  afterEach(async () => await cleanProject(projectDir));
  afterEach(async () => process.chdir(originalWorkingDir));

  it('creates the expected change report markdown file', async () => {
    await handler({
      directory: projectDir,
      reportJsonFile: join(__dirname, 'inventory.json'),
      outputFile: 'inventory.md',
      templateName: 'welcome',
    });

    await verifyReportContents(join(__dirname, 'expectedReport.md.txt'), 'inventory.md');
  });
});
