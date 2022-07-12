const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const tmp = require('tmp');
const FingerprintWatchCommand = require('../../../src/fingerprint/fingerprintWatchCommand');
const { verbose } = require('../../../src/utils');

const appMapDir = tmp.dirSync().name;

// Because if you use arrow functions, there's no this:
/* eslint-disable prefer-arrow-callback */
describe(FingerprintWatchCommand, function () {
  beforeEach(function () {
    verbose(process.env.DEBUG === 'true');
  });
  afterEach(async function () {
    await this.cmd.close();
    sinon.restore();
  });

  describe('a pid file', function () {
    it('is created when env var is set', async function () {
      sinon.stub(process, 'env').value({ APPMAP_WRITE_PIDFILE: 'true' });
      this.cmd = new FingerprintWatchCommand(appMapDir);

      await this.cmd.execute();

      expect(fs.existsSync(path.join(appMapDir, 'index.pid'))).toBeTruthy();
    });

    it('is not created when env var is unset', async function () {
      this.cmd = new FingerprintWatchCommand(appMapDir);
      await this.cmd.execute();

      expect(fs.existsSync(path.join(appMapDir, 'index.pid'))).toBeFalsy();
    });
  });
});
