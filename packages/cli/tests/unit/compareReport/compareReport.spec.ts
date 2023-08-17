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
const changeReportPath = path.join(changeReportDirectory, 'change-report.json');

describe('compare-report command', () => {
  beforeAll(async () => {
    await cleanProject(compareFixturePath);
    copyFileSync(path.join(compareFixturePath, 'expected-change-report.json'), changeReportPath);
  });

  afterEach(async () => {
    await cleanProject(compareFixturePath);
  });

  afterAll(() => {
    process.chdir(originalWorkingDir);
  });

  it('creates the expected change report markdown file', async () => {
    await handler({
      directory: compareFixturePath,
      reportDirectory: changeReportDirectory,
    });

    const actualReportPath = path.join(changeReportDirectory, 'report.md');
    assert(existsSync(actualReportPath));

    const actualReport = String(readFileSync(actualReportPath));
    const expectedReport = String(readFileSync(path.join(__dirname, 'expectedReport.md')));
    assert.strictEqual(removeTimeStampLines(actualReport), removeTimeStampLines(expectedReport));
  });
});
