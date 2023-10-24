import path, { join } from 'path';

import { handler } from '../../../src/cmds/inventory-report/inventoryReport';
import { cleanProject, fixtureDir } from '../util';
import verifyReportContents from '../compareReport/verifyReportContents';
import * as loadAppMapConfig from '../../../src/lib/loadAppMapConfig';

const originalWorkingDir = process.cwd();
const projectDir = path.join(fixtureDir, 'inventory');

describe(`inventory-report 'summary'`, () => {
  afterEach(async () => await cleanProject(projectDir));
  afterEach(async () => process.chdir(originalWorkingDir));
  afterEach(async () => jest.restoreAllMocks());

  it('creates the expected change report markdown file', async () => {
    const appmapConfig: loadAppMapConfig.AppMapConfig = {
      language: 'ruby',
      appmap_dir: 'tmp/appmap',
      name: 'sample project',
      packages: [
        {
          path: 'app',
        },
      ],
    };
    const loadAppMapConfigSpy = jest
      .spyOn(loadAppMapConfig, 'default')
      .mockResolvedValue(appmapConfig);

    await handler({
      directory: projectDir,
      reportJsonFile: join(__dirname, 'inventory.json'),
      outputFile: 'summary.md',
      templateName: 'summary',
    });

    expect(loadAppMapConfigSpy).toHaveBeenCalledTimes(1);

    await verifyReportContents(join(__dirname, 'summary.md.txt'), 'summary.md', [
      [/_.* old_/g, '@@time_ago@@'],
    ]);
  });
});
