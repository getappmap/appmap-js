import { retry } from 'async';
import { existsSync, copyFileSync } from 'fs';
import { access, rm, stat } from 'fs/promises';
import { basename, join } from 'path';
import { restore, stub } from 'sinon';
import { dirSync } from 'tmp';
import FingerprintWatchCommand from '../../../src/fingerprint/fingerprintWatchCommand';
import { verbose } from '../../../src/utils';
import * as client from '@appland/client';
import { mkdir } from 'fs/promises';
import { FSWatcher } from 'chokidar';

jest.mock('@appland/telemetry', () => {
  const originalModule = jest.requireActual('@appland/telemetry');
  return {
    __esModule: true,
    ...originalModule,
    Telemetry: {
      sendEvent: jest.fn(),
    },
  };
});

jest.mock('@appland/client');
const Usage = jest.mocked(client.Usage);

describe(FingerprintWatchCommand, () => {
  let cmd: FingerprintWatchCommand | null;
  let appMapDir: string;

  beforeEach(() => {
    Usage.update.mockResolvedValue();
    verbose(process.env.DEBUG === 'true');
    appMapDir = dirSync({ unsafeCleanup: true }).name;
  });

  afterEach(async () => {
    if (cmd) {
      await cmd.close();
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
      const target = join(appMapDir, name);
      copyFileSync(join(__dirname, path), target);
      return target;
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

    it('removes index when appmap is removed', async () => {
      const appMapPath = placeMap();
      const indexPath = join(appMapDir, 'revoke_api_key', 'mtime');
      cmd = new FingerprintWatchCommand(appMapDir);

      await cmd.execute();
      await verifyIndexSuccess();

      await rm(appMapPath);
      // For good measure. Anything to do with these events just seems to be unreliable.
      cmd.removed(appMapPath);

      return retry({ interval: 100, times: 10 }, async () => {
        try {
          await access(indexPath);
        } catch {
          return;
        }
        throw new Error('still exists');
      });
    });

    it('works eventually even if watching files is flaky', async () => {
      cmd = new FingerprintWatchCommand(appMapDir);
      await cmd.execute(0.01, 100);
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
      expect.assertions(5);
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

    it('does not raise if it hits the limit of the number of file watchers', () =>
      testDisableFileWatching(
        'ENOSPC: System limit for number of file watchers reached',
        'ENOSPC'
      ));

    it('does not raise if it hits the limit of the number of open files', () =>
      testDisableFileWatching('EMFILE: too many open files', 'EMFILE'));

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
  });
});
