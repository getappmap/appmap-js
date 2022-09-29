import { retry } from 'async';
import { existsSync, copyFileSync } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';
import { restore, stub } from 'sinon';
import { dirSync } from 'tmp';
import FingerprintWatchCommand from '../../../src/fingerprint/fingerprintWatchCommand';
import { verbose } from '../../../src/utils';

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
    function placeMap() {
      copyFileSync(
        join(__dirname, '../fixtures/ruby/revoke_api_key.appmap.json'),
        join(appMapDir, 'revoke_api_key.appmap.json')
      );
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
  });
});
