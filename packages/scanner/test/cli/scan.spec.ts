import { join } from 'path';
import nock from 'nock';
import sinon from 'sinon';
import fsextra from 'fs-extra';
import * as test from '../integration/setup';
import Command from '../../src/cli/scan/command';
import { fixtureAppMapFileName } from '../util';
import { readFileSync, unlinkSync } from 'fs';
import { ScanResults } from '../../src/report/scanResults';
import { copyFile, mkdtemp, readFile, rm, stat, writeFile } from 'fs/promises';
import { Watcher } from '../../src/cli/scan/watchScan';
import { tmpdir } from 'os';
import { dump } from 'js-yaml';
import CommandOptions from '../../src/cli/scan/options';
import tmp from 'tmp-promise';

process.env['APPMAP_TELEMETRY_DISABLED'] = 'true';
delete process.env.APPLAND_API_KEY;
delete process.env.APPLAND_URL;

const ReportFile = 'appmap-findings.json';
const AppId = test.AppId;
const DefaultScanConfigFilePath = join(__dirname, '..', '..', 'src', 'sampleConfig', 'default.yml');
const StandardOneShotScanOptions = {
  appmapFile: fixtureAppMapFileName(
    'org_springframework_samples_petclinic_owner_OwnerControllerTests_testInitCreationForm.appmap.json'
  ),
  config: DefaultScanConfigFilePath, // need to pass it explicitly
  reportFile: ReportFile,
  app: AppId,
  all: false,
  interactive: false,
  watch: false,
} as const;

function isError(error: unknown, code: string): boolean {
  const err = error as NodeJS.ErrnoException;
  return err.code === code;
}

afterEach(() => {
  try {
    unlinkSync(ReportFile);
  } catch (err) {
    if (!isError(err, 'ENOENT')) throw err;
  }
});
afterEach(() => sinon.restore());
afterEach(() => nock.cleanAll());

function runCommand(options: CommandOptions): Promise<void> {
  return Command.handler({ $0: 'test', _: [], ...options });
}

describe('scan', () => {
  it('errors with default options and without AppMap server API key', async () => {
    delete process.env.APPLAND_API_KEY;
    try {
      await runCommand(StandardOneShotScanOptions);
      throw new Error(`Expected this command to fail`);
    } catch (err) {
      expect((err as any).toString()).toMatch(/No API key available for AppMap server/);
    }
  });

  async function checkScan(options: CommandOptions): Promise<void> {
    await runCommand(options);

    const scanResults = JSON.parse(readFileSync(ReportFile).toString()) as ScanResults;
    expect(scanResults.summary).toBeTruthy();
    const appMapMetadata = scanResults.summary.appMapMetadata;
    expect(appMapMetadata.apps).toEqual(['spring-petclinic']);
    const checks = scanResults.configuration.checks;
    ['http-500', 'n-plus-one-query'].forEach((rule) =>
      expect(checks.map((check) => check.rule)).toContain(rule)
    );
    expect(Object.keys(scanResults).sort()).toEqual([
      'appMapMetadata',
      'checks',
      'configuration',
      'findings',
      'summary',
    ]);
  }

  it('runs with server access disabled', async () => {
    await checkScan({ ...StandardOneShotScanOptions, all: true });
  });

  it('errors when the provided appId is not valid', async () => {
    nock('http://localhost:3000').head(`/api/${AppId}`).reply(404);

    try {
      await runCommand(StandardOneShotScanOptions);
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

    await runCommand(StandardOneShotScanOptions);
  });

  it('skips when encountering a bad file in a directory', async () =>
    tmp.withDir(
      async ({ path }) => {
        await copyFile(StandardOneShotScanOptions.appmapFile, join(path, 'good.appmap.json'));
        await writeFile(join(path, 'bad.appmap.json'), 'bad json');

        const options: CommandOptions = {
          ...StandardOneShotScanOptions,
          all: true,
          appmapDir: path,
        };
        delete options.appmapFile;

        await checkScan(options);
      },
      { unsafeCleanup: true }
    ));

  it('errors when no good files were found', async () =>
    tmp.withDir(
      async ({ path }) => {
        await writeFile(join(path, 'bad.appmap.json'), 'bad json');

        const options: CommandOptions = {
          ...StandardOneShotScanOptions,
          all: true,
          appmapDir: path,
        };
        delete options.appmapFile;

        expect.assertions(1);
        return runCommand(options).catch((e: Error) => {
          expect(e.message).toMatch(/Error processing/);
        });
      },
      { unsafeCleanup: true }
    ));

  it('errors when a bad file is explicitly provided', async () =>
    tmp.withFile(async ({ path }) => {
      await writeFile(path, 'bad json');
      const options = {
        ...StandardOneShotScanOptions,
        all: true,
        appmapFile: [path, StandardOneShotScanOptions.appmapFile],
      };
      expect.assertions(1);
      return runCommand(options).catch((e: Error) => {
        expect(e.message).toMatch(/Error processing/);
      });
    }));

  describe('watch mode', () => {
    let watcher: Watcher | undefined;
    let findingsFile: string;
    let scanConfigFilePath: string;
    let tmpDir: string;
    let secretInLogDir: string;
    const maxDelay = 10000;

    async function expectScan(): Promise<ScanResults> {
      async function updateMtime() {
        return writeFile(join(secretInLogDir, 'mtime'), Date.now().toString());
      }

      return new Promise<ScanResults>((resolve, reject) => {
        const startTime = Date.now();

        async function assertFindings(): Promise<void | NodeJS.Timeout> {
          const elapsed = Date.now() - startTime;

          try {
            await stat(findingsFile);
          } catch (err) {
            if (elapsed < maxDelay) return setTimeout(assertFindings, 100);

            return reject(`Expected appmap-findings.json in ${secretInLogDir} after ${elapsed}ms`);
          }

          resolve(JSON.parse((await readFile(findingsFile)).toString()) as ScanResults);
        }

        setTimeout(updateMtime, 250);
        setTimeout(assertFindings, 500);
      });
    }

    async function createIndexDirectory(): Promise<void> {
      await fsextra.copy(DefaultScanConfigFilePath, scanConfigFilePath);
      await fsextra.copy(join(__dirname, '..', 'fixtures', 'appmaps', 'secretInLog'), tmpDir, {
        recursive: true,
      });
      await fsextra.mkdir(
        join(
          tmpDir,
          'Confirmation_already_confirmed_user_should_not_be_able_to_confirm_the_account_again'
        )
      );
    }

    beforeEach(async () => {
      tmpDir = await fsextra.mkdtemp(tmpdir() + '/');
      secretInLogDir = join(
        tmpDir,
        'Confirmation_already_confirmed_user_should_not_be_able_to_confirm_the_account_again'
      );
      scanConfigFilePath = join(tmpDir, 'appmap-scanner.yml');
      findingsFile = join(secretInLogDir, 'appmap-findings.json');

      createIndexDirectory();

      watcher = new Watcher({
        appId: 'no-such-app',
        appmapDir: tmpDir,
        configFile: scanConfigFilePath,
      });
      await watcher.watch();
    });

    afterEach(async () => {
      if (watcher) watcher.close();

      fsextra.rmdir(tmpDir, { recursive: true });
    });

    it('scans AppMaps when the mtime file is created or changed', async () => {
      const findings = await expectScan();

      expect(findings.findings.length).toEqual(1);
      expect(findings.findings[0].ruleId).toEqual('secret-in-log');
    });

    it('reloads the scanner configuration automatically', async () => {
      await expectScan();

      await rm(findingsFile);
      await writeFile(scanConfigFilePath, dump({ checks: [{ rule: 'http-500' }] }));

      const findings = await expectScan();

      expect(findings.checks.length).toEqual(1);
      expect(findings.checks[0].rule.id).toEqual('http-500');
    });

    it('picks up mtime changes after a relative directory is removed and recreated', async () => {
      {
        const findings = await expectScan();
        expect(findings.findings.length).toEqual(1);
        expect(findings.findings[0].ruleId).toEqual('secret-in-log');
      }

      await rm(secretInLogDir, { recursive: true });
      await createIndexDirectory();

      {
        const findings = await expectScan();
        expect(findings.findings.length).toEqual(1);
        expect(findings.findings[0].ruleId).toEqual('secret-in-log');
      }
    });
  });
});
