import { join } from 'path';
import nock from 'nock';
import sinon from 'sinon';
import Command from '../../src/cli/scan/command';
import { fixtureAppMapFileName } from '../util';
import { readFileSync, unlinkSync } from 'fs';
import { ScanResults } from '../../src/report/scanResults';

const ReportFile = 'appland-findings.json';
const ApiKey = 'dummy';
const AppId = 'my-org/my-app';
const StandardOptions = {
  appmapFile: fixtureAppMapFileName(
    'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
  ),
  config: join(__dirname, '..', '..', 'src', 'sampleConfig', 'default.yml'), // need to pass it explicitly
  reportFile: ReportFile,
  app: AppId,
};

beforeEach(() => sinon.stub(process.stdout, 'write'));

afterEach(() => {
  try {
    unlinkSync(ReportFile);
  } catch (err) {
    expect((err as any).toString()).toMatch(/ENOENT/);
  }
});
afterEach(() => sinon.restore());
afterEach(() => nock.cleanAll());

describe('scan', () => {
  it('errors with default options and without AppMap server API key', async () => {
    try {
      await Command.handler(StandardOptions as any);
      throw new Error(`Expected this command to fail`);
    } catch (err) {
      expect((err as any).toString()).toMatch(/No API key available for AppMap server/);
    }
  });

  it('runs with server access disabled', async () => {
    await Command.handler(
      Object.assign(StandardOptions, {
        all: true,
      } as any)
    );

    const scanResults = JSON.parse(readFileSync(ReportFile).toString()) as ScanResults;
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
  });

  it('integrates server finding status with local findings', async () => {
    nock('http://localhost:3000').get(`/api/${AppId}/finding_status`);

    await Command.handler(Object.assign(StandardOptions, { apiKey: ApiKey }) as any);

    expect(nock.isDone()).toBeTruthy();
  });
});
