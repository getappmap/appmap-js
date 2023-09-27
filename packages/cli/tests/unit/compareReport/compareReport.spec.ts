import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

import { handler } from '../../../src/cmds/compare-report/compareReport';
import { cleanProject, fixtureDir } from '../util';
import { writeFile } from 'fs/promises';

function removeTimeStampLines(report: string): string {
  return report.replace(/[-+]{3}.*openapi\.yml.*\n/g, '');
}

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
  beforeEach(async () => {
    await cleanProject(compareFixturePath);
  });

  afterEach(async () => {
    await cleanProject(compareFixturePath);
    process.chdir(originalWorkingDir);
  });

  function readReportFile(filePath: string): string {
    assert(existsSync(filePath));
    const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
    const removeWhitespaceLines = lines.filter(Boolean).filter((line) => !line.match(/^\s*$/));
    return removeTimeStampLines(removeWhitespaceLines.join('\n'));
  }

  async function verifyReportContents(expectedReportFileName: string) {
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

    const actualReport = readReportFile(actualReportPath);
    expect(actualReport).toContain('<h2 id="openapi-changes">🔄 API changes</h2>');
    expect(actualReport).not.toContain('<h2 id="changed-appmaps">🔀 Changed AppMaps</h2>');

    await verifyReportContents('expectedReport.md.txt');
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
