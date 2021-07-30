const { utimesSync } = require('fs');
const { join } = require('path');
const tmp = require('tmp');
const fs = require('fs-extra');
const Depends = require('../../src/depends');
const Fingerprinter = require('../../src/fingerprint/fingerprinter');
const { listAppMapFiles, verbose } = require('../../src/utils');

tmp.setGracefulCleanup();

const fixtureDir = join(__dirname, 'fixtures', 'ruby');
const appMapDir = tmp.dirSync().name;

const userModelFilePath = join(appMapDir, 'app/models/user.rb');
const now = Date.now();

describe('Depends', () => {
  beforeAll(async () => {
    if (process.env.DEBUG) {
      verbose(true);
    }

    fs.copySync(fixtureDir, appMapDir);

    const fingerprinter = new Fingerprinter(true);
    await listAppMapFiles(appMapDir, async (fileName) => {
      utimesSync(fileName, now, now);
      await fingerprinter.fingerprint(fileName);
    });
  });

  test('indicates when no dependency is modified', async () => {
    const fn = new Depends(appMapDir);
    fn.baseDir = join(appMapDir, 'app');
    const depends = await fn.depends();
    expect(depends).toEqual([]);
  });

  test('indicates when a dependency is modified', async () => {
    const future = now + 1000;
    utimesSync(userModelFilePath, future, future);

    const fn = new Depends(appMapDir);
    fn.baseDir = appMapDir;
    const depends = await fn.depends();
    expect(depends).toEqual([join(appMapDir, 'user_page_scenario')]);
  });

  test('indicates dependencies in an explicit list', async () => {
    const fn = new Depends(appMapDir);
    fn.files = ['app/models/user.rb'];
    const depends = await fn.depends();
    expect(depends).toEqual([join(appMapDir, 'user_page_scenario')]);
  });

  test('AppMaps will be yielded to a callback function', async () => {
    const result = [];
    const fn = new Depends(appMapDir);
    fn.files = ['app/models/user.rb'];
    await fn.depends((file) => result.push(file));
    expect(result).toEqual([join(appMapDir, 'user_page_scenario')]);
  });
});
