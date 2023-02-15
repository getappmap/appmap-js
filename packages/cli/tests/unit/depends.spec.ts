import { utimesSync } from 'fs';
import { join } from 'path';
import tmp from 'tmp';
import fs from 'fs-extra';

import Fingerprinter from '../../src/fingerprint/fingerprinter';
import Depends from '../../src/depends';
import { listAppMapFiles, verbose } from '@appland/common/src/utils';

if (process.env.DEBUG !== 'true') tmp.setGracefulCleanup();

const fixtureDir = join(__dirname, 'fixtures', 'ruby');
const now = new Date();

describe('Depends', () => {
  let appMapDir: string;
  let expected: string;
  let userModelFilePath: string;

  beforeAll(async () => verbose(process.env.DEBUG === 'true'));
  beforeEach(async () => {
    appMapDir = tmp.dirSync().name;
    expected = join(appMapDir, 'user_page_scenario').replace(/\\/g, '/');
    userModelFilePath = join(appMapDir, 'app/models/user.rb');

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
    const depends = await fn.depends(() => {});
    expect(depends).toEqual([]);
  });

  test('indicates when a dependency is modified', async () => {
    const future = new Date(now.getTime() + 10000);
    utimesSync(userModelFilePath, future, future);

    const fn = new Depends(appMapDir);
    fn.baseDir = appMapDir;
    const depends = await fn.depends(() => {});
    expect(depends).toEqual([expected]);
  });

  test('indicates dependencies in an explicit list', async () => {
    const fn = new Depends(appMapDir);
    fn.files = ['app/models/user.rb'];
    const depends = await fn.depends(() => {});
    expect(depends).toEqual([expected]);
  });

  test('AppMaps will be yielded to a callback function', async () => {
    const result: any[] = [];
    const fn = new Depends(appMapDir);
    fn.files = ['app/models/user.rb'];
    await fn.depends((file) => result.push(file));
    expect(result).toEqual([expected]);
  });
});
