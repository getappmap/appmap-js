import path, { join } from 'path';

import { handler } from '../../../src/cmds/compare-report/compareReport';
import { cleanProject, fixtureDir } from '../util';
import readReportFile from './readReportFile';
import verifyReportContents from './verifyReportContents';

const originalWorkingDir = process.cwd();
const compareFixturePath = path.join(fixtureDir, 'compare');
const changeReportDirectory = path.join(
  compareFixturePath,
  '.appmap',
  'change-report',
  `all-succeeded`
);
const actualReportPath = path.join(changeReportDirectory, 'report.md');

describe('compare-report command', () => {
  afterEach(async () => {
    await cleanProject(compareFixturePath);
    process.chdir(originalWorkingDir);
  });

  it('creates the expected change report markdown file', async () => {
    await handler({
      directory: compareFixturePath,
      reportDirectory: changeReportDirectory,
    });

    const actualReport = readReportFile(actualReportPath);
    expect(actualReport).toContain('<h2 id="openapi-changes">🔄 API changes</h2>');
    expect(actualReport).not.toContain('<h2 id="changed-appmaps">🔀 Changed AppMaps</h2>');

    await verifyReportContents(join(__dirname, 'expectedReport.md.txt'), actualReportPath);
  });

  it('default section can be disabled', async () => {
    await handler({
      directory: compareFixturePath,
      reportDirectory: changeReportDirectory,
      excludeSection: ['openapi-diff'],
    });

    const actualReport = readReportFile(actualReportPath);
    expect(actualReport).not.toContain('<h2 id="openapi-changes">🔄 API changes</h2>');
  });

  it('optional section can be enabled', async () => {
    await handler({
      directory: compareFixturePath,
      reportDirectory: changeReportDirectory,
      includeSection: ['changed-appmaps'],
    });

    const actualReport = readReportFile(actualReportPath);
    expect(actualReport).toContain('<h2 id="changed-appmaps">🔀 Changed AppMaps</h2>');
  });
});
