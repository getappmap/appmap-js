import { Arguments } from 'yargs';
import * as resolveAppId from '../../src/cli/resolveAppId';
import ScanCommand from '../../src/cli/scan/command';
import CommandOptions from '../../src/cli/scan/options';
import * as Scanner from '../../src/cli/scan/scanner';
import * as watchScan from '../../src/cli/scan/watchScan';
import tmp from 'tmp-promise';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path, { basename } from 'node:path';

jest.mock('../../src/telemetry');

const defaultArguments: Arguments<CommandOptions> = {
  _: [],
  $0: 'scan',
  watch: false,
  stateFile: 'appmap-findings-state.yml',
  findingState: [],
  config: 'appmap-scanner.yml',
  reportFile: 'appmap-findings.json',
};

describe('commands', () => {
  const cwd = process.cwd();

  afterEach(() => {
    jest.restoreAllMocks();
    process.chdir(cwd);
  });

  describe('scan --watch', () => {
    let watcher: watchScan.Watcher | undefined;

    afterEach(() => {
      if (watcher) {
        const closer = watcher.close();
        watcher = undefined;
        return closer;
      }
    });

    it('resolves appId, but its absence is benign', async () => {
      // Prevent the watcher from running indefinitely
      jest.spyOn(watchScan, 'default').mockResolvedValue();

      const spy = jest.spyOn(resolveAppId, 'default');

      try {
        await ScanCommand.handler({ ...defaultArguments, watch: true });
      } catch (e) {
        expect(e).not.toBeTruthy();
      }

      expect(spy).toBeCalled();
    });

    it('work correctly even if the appmap directory does not initially exist', () =>
      tmp.withDir(
        async ({ path: tmpDir }) => {
          jest.spyOn(watchScan, 'default').mockImplementation((opts) => {
            watcher = new watchScan.Watcher(opts);
            return watcher.watch();
          });

          await writeFile(path.join(tmpDir, 'appmap.yml'), 'appmap_dir: tmp/appmap\n');
          await ScanCommand.handler({
            ...defaultArguments,
            watch: true,
            directory: tmpDir,
          });

          const OriginalScanner = Scanner.default;
          const scanned = new Promise<void>((resolve) =>
            jest.spyOn(Scanner, 'default').mockImplementation((...args) => {
              resolve();
              return new OriginalScanner(...args);
            })
          );

          const appmapDir = path.join(tmpDir, 'tmp', 'appmap');
          const appmapSrc = path.join(
            __dirname,
            '../fixtures/appmaps/JWT.decode_no_validation.appmap.json'
          );
          const indexDir = path.join(appmapDir, basename(appmapSrc, '.appmap.json'));
          await mkdir(indexDir, { recursive: true });
          await copyFile(appmapSrc, path.join(appmapDir, basename(appmapSrc)));
          await writeFile(path.join(indexDir, 'mtime'), Date.now().toString());

          await scanned;
        },
        { unsafeCleanup: true }
      ));
  });
});
