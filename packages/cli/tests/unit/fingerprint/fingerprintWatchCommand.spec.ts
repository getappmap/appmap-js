import { retry } from 'async';
import { existsSync, copyFileSync } from 'fs';
import { stat } from 'fs/promises';
import { basename, join } from 'path';
import { restore, stub } from 'sinon';
import { dirSync } from 'tmp';
import FingerprintWatchCommand from '../../../src/fingerprint/fingerprintWatchCommand';
import { verbose } from '../../../src/utils';
import OriginalTelemetry from '../../../src/telemetry';
import { once } from 'events';
import Fingerprinter from '../../../src/fingerprint/fingerprinter';
import { MaxMSBetween } from '../../../src/lib/eventAggregator';
import { mkdir } from 'fs/promises';
import { FSWatcher } from 'chokidar';

jest.mock('../../../src/telemetry');
const Telemetry = jest.mocked(OriginalTelemetry);

describe(FingerprintWatchCommand, () => {
  let cmd: FingerprintWatchCommand | null;
  let appMapDir: string;

  beforeEach(() => {
    verbose(process.env.DEBUG === 'true');
    appMapDir = dirSync({ unsafeCleanup: true }).name;
  });

  afterEach(async () => {
    if (cmd) {
      cmd.close();
      cmd = null;
    }
    restore();
  });

  describe('a pid file', () => {
    it('is created when env var is set', async () => {
      stub(process, 'env').value({ APPMAP_WRITE_PIDFILE: 'true' });
      cmd = new FingerprintWatchCommand(appMapDir);

      await cmd.execute();

      expect(existsSync(join(appMapDir, 'index.pid'))).toBeTruthy();
    });

    it('is not created when env var is unset', async () => {
      cmd = new FingerprintWatchCommand(appMapDir);
      await cmd.execute();

      expect(existsSync(join(appMapDir, 'index.pid'))).toBeFalsy();
    });
  });

  describe('indexing', () => {
    function placeMap(path = '../fixtures/ruby/revoke_api_key.appmap.json', name?: string) {
      name ||= basename(path);
      copyFileSync(join(__dirname, path), join(appMapDir, name));
    }

    async function verifyIndexSuccess(interval = 100, times = 10) {
      const probe = join(appMapDir, 'revoke_api_key', 'mtime');
      return retry({ interval, times }, async () => stat(probe));
    }

    it('occurs on existing un-indexed appmaps', async () => {
      placeMap();
      cmd = new FingerprintWatchCommand(appMapDir);
      await cmd.execute();
      return verifyIndexSuccess();
    }, 11000);

    it('works eventually even if watching files is flaky', async () => {
      cmd = new FingerprintWatchCommand(appMapDir);
      await cmd.execute();
      cmd.watcher?.removeAllListeners();
      placeMap();
      return verifyIndexSuccess(200, 20);
    });

    it('does not raise if it encounters an unreadable directory', async () => {
      await mkdir(join(appMapDir, 'eacces'), { mode: 0 });
      cmd = new FingerprintWatchCommand(appMapDir);
      await cmd.execute();
      placeMap();
      return verifyIndexSuccess(200, 20);
    });

    async function testDisableFileWatching(errorMessage: string, code: string) {
      cmd = new FingerprintWatchCommand(appMapDir);
      const err = new Error(errorMessage);
      (err as NodeJS.ErrnoException).code = code;
      await cmd.watcherErrorFunction(err);
      expect(cmd.watcher).toBeUndefined();

      cmd.watcher = new FSWatcher();
      expect(cmd.watcher).not.toBeUndefined();
      const mockWarn = jest.spyOn(console, 'warn').mockImplementation();
      await cmd.watcherErrorFunction(err);
      expect(cmd.watcher).toBeUndefined(); // file watching was disabled
      expect(mockWarn).toBeCalledTimes(3);
      expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
      mockWarn.mockRestore();
    }

    it('does not raise if it hits the limit of the number of file watchers', async () => {
      testDisableFileWatching('ENOSPC: System limit for number of file watchers reached', 'ENOSPC');
    });

    it('does not raise if it hits the limit of the number of open files', async () => {
      testDisableFileWatching('EMFILE: too many open files', 'EMFILE');
    });

    it('gets filenames from error messages', async () => {
      cmd = new FingerprintWatchCommand(appMapDir);
      expect(
        cmd.getFilenameFromErrorMessage(
          `Error: UNKNOWN: unknown error, lstat 'c:\\Users\\Test\\Programming\\MyProject'`
        )
      ).toBe('c:\\Users\\Test\\Programming\\MyProject');
    });

    it('does not raise on unknown error lstat', async () => {
      cmd = new FingerprintWatchCommand(appMapDir);
      cmd.watcher = new FSWatcher();
      expect(cmd.watcher).not.toBeUndefined();
      expect(cmd.unreadableFiles.size).toBe(0);
      const mockWarn = jest.spyOn(console, 'warn').mockImplementation();
      const errorMessage = `Error: UNKNOWN: unknown error, lstat 'c:\\Users\\Test\\Programming\\MyProject'`;
      const err = new Error(errorMessage);
      (err as NodeJS.ErrnoException).code = 'UNKNOWN';
      await cmd.watcherErrorFunction(err);
      expect(cmd.watcher).not.toBeUndefined();
      expect(mockWarn).toBeCalledTimes(2);
      expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
      expect(cmd.unreadableFiles.size).toBe(1);
      expect(cmd.unreadableFiles.has('c:\\Users\\Test\\Programming\\MyProject')).toBe(true);
      // ignoring this file or directory works correctly
      expect(cmd.ignored('c:\\Users\\Test\\Programming\\MyProject')).toBe(true);
      expect(cmd.ignored('c:\\Users\\Test\\Programming\\MyProject\\some.appmap.json')).toBe(false);
      mockWarn.mockRestore();
    });

    it('does not raise if it finds symlinks pointing to directories up, leading to infinite loop', async () => {
      cmd = new FingerprintWatchCommand(appMapDir);
      cmd.watcher = new FSWatcher();
      expect(cmd.watcher).not.toBeUndefined();
      expect(cmd.symlinkLoopFiles.size).toBe(0);
      const mockWarn = jest.spyOn(console, 'warn').mockImplementation();
      const errorMessage = `Error: ELOOP: too many symbolic links encountered, stat '/Users/test/Documents/some_path/vendor/bundle/gems/autodoc-0.7.0/spec/dummy/spec'`;
      const err = new Error(errorMessage);
      (err as NodeJS.ErrnoException).code = 'ELOOP';
      await cmd.watcherErrorFunction(err);
      expect(cmd.watcher).not.toBeUndefined();
      expect(mockWarn).toBeCalledTimes(2);
      expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
      expect(cmd.symlinkLoopFiles.size).toBe(1);
      expect(
        cmd.symlinkLoopFiles.has(
          '/Users/test/Documents/some_path/vendor/bundle/gems/autodoc-0.7.0/spec/dummy/spec'
        )
      ).toBe(true);
      // ignoring this file or directory works correctly
      expect(
        cmd.ignored(
          '/Users/test/Documents/some_path/vendor/bundle/gems/autodoc-0.7.0/spec/dummy/spec'
        )
      ).toBe(true);
      expect(
        cmd.ignored(
          '/Users/test/Documents/some_path/vendor/bundle/gems/autodoc-0.7.0/spec/dummy/spec/some_other_file'
        )
      ).toBe(false);
      mockWarn.mockRestore();
    });

    describe('telemetry', () => {
      let handler: Fingerprinter;

      beforeEach(async () => {
        cmd = new FingerprintWatchCommand(appMapDir);
        handler = cmd.fpQueue.handler;
        await cmd.execute();
        jest.useFakeTimers();
        Telemetry.sendEvent.mockClear();
      });

      afterEach(() => {
        jest.runAllTimers();
        jest.useRealTimers();
      });

      it('aggregates indexes that occur less than one second apart', async () => {
        placeMap();
        await once(handler, 'index');
        jest.advanceTimersByTime(MaxMSBetween / 2.0);
        placeMap('../fixtures/ruby/user_page_scenario.appmap.json');
        await once(handler, 'index');
        jest.advanceTimersByTime(MaxMSBetween * 2.0);

        expect(Telemetry.sendEvent).toHaveBeenCalledTimes(1);
        const data = Telemetry.sendEvent.mock.calls[0][0];
        expect(data).toMatchObject({
          name: 'appmap:index',
          properties: {
            app: 'appland/AppLand',
            'language.name': 'ruby',
          },
          metrics: { appmaps: 2 },
        });
        expect(data.properties?.name).toBeUndefined();
      });

      it('send separate events for indexes that occur more than one second apart', async () => {
        placeMap();
        await once(handler, 'index');
        jest.advanceTimersByTime(MaxMSBetween * 1.1);
        placeMap('../fixtures/ruby/user_page_scenario.appmap.json');
        await once(handler, 'index');
        jest.advanceTimersByTime(MaxMSBetween * 2);

        expect(Telemetry.sendEvent).toHaveBeenCalledTimes(2);
        for (const [data] of Telemetry.sendEvent.mock.calls) {
          expect(data).toMatchObject({ name: 'appmap:index', metrics: { appmaps: 1 } });
        }
      });
    });
  });
});
