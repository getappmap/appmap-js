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
        jest.advanceTimersByTime(512);
        placeMap('../fixtures/ruby/user_page_scenario.appmap.json');
        await once(handler, 'index');
        jest.advanceTimersByTime(2048);

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
        jest.advanceTimersByTime(1024);
        placeMap('../fixtures/ruby/user_page_scenario.appmap.json');
        await once(handler, 'index');
        jest.advanceTimersByTime(2048);

        expect(Telemetry.sendEvent).toHaveBeenCalledTimes(2);
        for (const [data] of Telemetry.sendEvent.mock.calls) {
          expect(data).toMatchObject({ name: 'appmap:index', metrics: { appmaps: 1 } });
        }
      });
    });
  });
});
