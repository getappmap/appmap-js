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

  describe('indexing', () => {
    beforeEach(() => {
      fs.copyFileSync(
        path.join(__dirname, '../fixtures/ruby/revoke_api_key.appmap.json'),
        path.join(appMapDir, 'revoke_api_key.appmap.json')
      );
    });

    it('occurs on existing un-indexed appmaps', async () => {
      cmd = new FingerprintWatchCommand(appMapDir);
      await cmd.execute();

      const maxRetries = 10;
      function verifyFileExists(filePath, retryCount = 0) {
        if (fs.existsSync(filePath)) return;

        if (retryCount < maxRetries) {
          setTimeout(() => verifyFileExists(filePath, retryCount + 1), 1000);
        } else {
          throw new Error(`File ${filePath} does not exist after ${retryCount} retries`);
        }
      }

      verifyFileExists(path.join(appMapDir, 'revoke_api_key', 'mtime'));
    }, 11000);
  });
});
