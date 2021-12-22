import { join } from 'path';
import sinon from 'sinon';
import Command from '../../src/cli/scan/command';
import { fixtureAppMapFileName } from '../util';
import { readFileSync, unlinkSync } from 'fs';
import { ScanResults } from '../../src/report/scanResults';

describe('smoke test', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('runs with standard options', async () => {
    sinon.stub(process.stdout, 'write');
    const reportFile = 'appland-findings.json';
    await Command.handler({
      appmapFile: fixtureAppMapFileName(
        'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
      ),
      config: join(__dirname, '..', '..', 'src', 'sampleConfig', 'default.yml'), // need to pass it explicitly
      reportFile: reportFile,
    } as any);

    const scanResults = JSON.parse(readFileSync(reportFile).toString()) as ScanResults;
    expect(scanResults.summary).toBeTruthy();
    const appMapMetadata = scanResults.summary.appMapMetadata;
    expect(appMapMetadata.apps).toEqual(['spring-petclinic']);
    const checks = scanResults.configuration.checks;
    expect(checks.map((check) => check.rule).sort()).toEqual([
      'circularDependency',
      'http500',
      'missingContentType',
      'nPlusOneQuery',
    ]);
    expect(Object.keys(scanResults).sort()).toEqual([
      'appMapMetadata',
      'appMaps',
      'checks',
      'configuration',
      'findings',
      'summary',
    ]);
    unlinkSync(reportFile);
  });
});
