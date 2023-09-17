import assert from 'assert';
import { copyFileSync, existsSync, readFileSync } from 'fs';
import path from 'path';

import { handler } from '../../../src/cmds/compare-report/compareReport';
import { cleanProject, fixtureDir } from '../util';

function removeTimeStampLines(report: string): string {
  return report.replace(/[-+]{3}.*openapi\.yml.*\n/g, '');
}

const originalWorkingDir = process.cwd();
const compareFixturePath = path.join(fixtureDir, 'compare');
const changeReportDirectory = path.join(
  compareFixturePath,
  '.appmap',
  'change-report',
  `testBase-testHead`
);

describe('compare-report command', () => {
  beforeEach(async () => {
    await cleanProject(compareFixturePath);
  });

  afterEach(async () => {
    await cleanProject(compareFixturePath);
    process.chdir(originalWorkingDir);
  });

  function readReportFile(filePath: string): string {
    const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
    const removeWhitespaceLines = lines.filter(Boolean).filter((line) => !line.match(/^\s*$/));
    return removeTimeStampLines(removeWhitespaceLines.join('\n'));
  }

  async function verifyReportContents(expectedReportFileName: string) {
    const actualReportPath = path.join(changeReportDirectory, 'report.md');
    assert(existsSync(actualReportPath));

    const actualReport = readReportFile(actualReportPath);
    // .txt file to disable IDE auto-formatting.
    // Note that the IDE auto-formatting is actually good, beacuse it does things like replace
    // markdown elements such as '_' with '\_'. But it's not in scope for me to manually
    // make all the necessary changes right now.
    const expectedReport = readReportFile(path.join(__dirname, expectedReportFileName));
    assert.strictEqual(actualReport, expectedReport);
  }

  it('creates the expected change report markdown file', async () => {
    await handler({
      directory: compareFixturePath,
      reportDirectory: changeReportDirectory,
    });

    await verifyReportContents('expectedReport.md.txt');
  });

  it('default section can be disabled', async () => {
    await handler({
      directory: compareFixturePath,
      reportDirectory: changeReportDirectory,
      excludeSection: ['openapi-diff'],
    });

    await verifyReportContents('expectedReport-openapiDiff.md.txt');
  });

  it('optional section can be enabled', async () => {
    await handler({
      directory: compareFixturePath,
      reportDirectory: changeReportDirectory,
      includeSection: ['changed-appmaps'],
    });

    await verifyReportContents('expectedReport-changedAppMaps.md.txt');
  });
});
