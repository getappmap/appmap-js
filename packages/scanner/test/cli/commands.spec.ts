import sinon from 'sinon';
import * as resolveAppId from '../../src/cli/resolveAppId';
import ScanCommand from '../../src/cli/scan/command';
import * as watchScan from '../../src/cli/scan/watchScan';

describe('commands', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('scan --watch', () => {
    beforeEach(() => {
      // Prevent the watcher from running indefinitely
      sinon.stub(watchScan, 'default').resolves();
    });

    it('does not attempt to resolve an app ID', async () => {
      const spy = sinon.spy(resolveAppId, 'default');

      try {
        await ScanCommand.handler({
          _: [],
          $0: 'scan',
          interactive: false,
          config: 'appmap-scanner.yml',
          all: false,
          watch: true,
          reportFile: 'appmap-findings.json',
        });
      } catch {
        // Do nothing.
        // We don't want exceptions, we just want to know if our stub was called.
      }

      expect(spy.called).toBe(false);
    });
  });
});
