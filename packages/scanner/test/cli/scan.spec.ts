import { join } from 'path';
import nock from 'nock';
import sinon from 'sinon';
import fsextra from 'fs-extra';
import * as test from '../integration/setup';
import Command from '../../src/cli/scan/command';
import { fixtureAppMapFileName } from '../util';
import { readFileSync, unlinkSync } from 'fs';
import { ScanResults } from '../../src/report/scanResults';
import { readFile, stat, writeFile } from 'fs/promises';
import { Watcher } from '../../src/cli/scan/watchScan';
import { parseConfigFile } from '../../src/configuration/configurationProvider';
import { tmpdir } from 'os';

process.env['APPMAP_TELEMETRY_DISABLED'] = 'true';
const ReportFile = 'appmap-findings.json';
const AppId = test.AppId;
const ConfigFilePath = join(__dirname, '..', '..', 'src', 'sampleConfig', 'default.yml');
const StandardOptions = {
  appmapFile: fixtureAppMapFileName(
    'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
  ),
  config: ConfigFilePath, // need to pass it explicitly
  reportFile: ReportFile,
  app: AppId,
};

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
    delete process.env.APPLAND_API_KEY;
    try {
      await Command.handler(StandardOptions as any);
      throw new Error(`Expected this command to fail`);
    } catch (err) {
      expect((err as any).toString()).toMatch(/No API key available for AppMap server/);
    }
  });

  it('runs with server access disabled', async () => {
    delete process.env.APPLAND_API_KEY;
    delete process.env.APPLAND_URL;
    await Command.handler(
      Object.assign({}, StandardOptions, {
        all: true,
      } as any)
    );

    const scanResults = JSON.parse(readFileSync(ReportFile).toString()) as ScanResults;
    expect(scanResults.summary).toBeTruthy();
    const appMapMetadata = scanResults.summary.appMapMetadata;
    expect(appMapMetadata.apps).toEqual(['spring-petclinic']);
    const checks = scanResults.configuration.checks;
    ['http500', 'nPlusOneQuery'].forEach((rule) =>
      expect(checks.map((check) => check.rule)).toContain(rule)
    );
    expect(Object.keys(scanResults).sort()).toEqual([
      'appMapMetadata',
      'checks',
      'configuration',
      'findings',
      'summary',
    ]);
  });

  it('errors when the provided appId is not valid', async () => {
    nock('http://localhost:3000').head(`/api/${AppId}`).reply(404);

    try {
      await Command.handler(StandardOptions as any);
      throw new Error(`Expected this command to fail`);
    } catch (e) {
      expect((e as any).message).toMatch(
        /App "myorg\/sample_app_6th_ed" is not valid or does not exist./
      );
    }
  });

  it('integrates server finding status with local findings', async () => {
    const localhost = nock('http://localhost:3000');
    localhost.head(`/api/${AppId}`).reply(204).persist();
    localhost.get(`/api/${AppId}/finding_status`).reply(200, JSON.stringify([]));

    await Command.handler(StandardOptions as any);
  });

  describe('watch mode', () => {
    let tmpDir: string;
    let secretInLogDir: string;
    const maxDelay = 10000;

    beforeEach(async () => {
      tmpDir = await fsextra.mkdtemp(tmpdir() + '/');
      secretInLogDir = join(
        tmpDir,
        'Confirmation_already_confirmed_user_should_not_be_able_to_confirm_the_account_again'
      );

      await fsextra.copy(join(__dirname, '..', 'fixtures', 'appmaps', 'secretInLog'), tmpDir, {
        recursive: true,
      });
      await fsextra.mkdir(
        join(
          tmpDir,
          'Confirmation_already_confirmed_user_should_not_be_able_to_confirm_the_account_again'
        )
      );
    });

    it('scans AppMaps when the mtime file is created or changed', async () => {
      const configData = await parseConfigFile(ConfigFilePath);
      const watcher = new Watcher({ appmapDir: tmpDir, configData });

      async function updateMtime() {
        return writeFile(join(secretInLogDir, 'mtime'), Date.now().toString());
      }

      watcher.watch();
      return new Promise<void>((resolve, reject) => {
        const startTime = Date.now();

        async function assertFindings(): Promise<void | NodeJS.Timeout> {
          const elapsed = Date.now() - startTime;

          try {
            await stat(join(secretInLogDir, 'appmap-findings.json'));
          } catch (err) {
            if (elapsed < maxDelay) return setTimeout(assertFindings, 100);

            watcher.abort();
            return reject(`Expected appmap-findings.json in ${secretInLogDir} after ${elapsed}ms`);
          }

          const findings = JSON.parse(
            (await readFile(join(secretInLogDir, 'appmap-findings.json'))).toString()
          ) as ScanResults;
          expect(findings.findings.length).toEqual(1);
          expect(findings.findings[0].ruleId).toEqual('secret-in-log');
          watcher.abort();
          fsextra.rmdir(tmpDir, { recursive: true });
          resolve();
        }

        setTimeout(updateMtime, 250);
        setTimeout(assertFindings, 500);
      });
    });
  });
});
