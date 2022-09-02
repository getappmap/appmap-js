const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const tmp = require('tmp');
const FingerprintWatchCommand = require('../../../src/fingerprint/fingerprintWatchCommand');
const { verbose } = require('../../../src/utils');

const appMapDir = tmp.dirSync().name;

describe(FingerprintWatchCommand, () => {
  let cmd;

  beforeEach(() => {
    verbose(process.env.DEBUG === 'true');
  });

  afterEach(async () => {
    if (cmd) {
      cmd.close();
      cmd = null;
    }
    sinon.restore();
  });

  describe('a pid file', () => {
    it('is created when env var is set', async () => {
      sinon.stub(process, 'env').value({ APPMAP_WRITE_PIDFILE: 'true' });
      cmd = new FingerprintWatchCommand(appMapDir);

      await cmd.execute();

      expect(fs.existsSync(path.join(appMapDir, 'index.pid'))).toBeTruthy();
    });

    it('is not created when env var is unset', async () => {
      cmd = new FingerprintWatchCommand(appMapDir);
      await cmd.execute();

      expect(fs.existsSync(path.join(appMapDir, 'index.pid'))).toBeFalsy();
    });
  });
});
