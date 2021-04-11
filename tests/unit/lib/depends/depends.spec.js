import { utimesSync } from 'fs';
import { join } from 'path';
import Depends from '../../../../src/lib/cli/depends';
import Fingerprinter from '../../../../src/lib/cli/fingerprinter';
import { listAppMapFiles, verbose } from '../../../../src/lib/cli/utils';

const appMapDir = join(__dirname, '../../fixtures/depends');
const userModelFilePath = join(appMapDir, 'src/app/models/user.rb');

const now = Date.now();

describe('Depends', () => {
  beforeAll(async () => {
    if (process.env.DEBUG) {
      verbose(true);
    }

    const fingerprinter = new Fingerprinter(true);
    await listAppMapFiles(appMapDir, async (fileName) => {
      utimesSync(fileName, now, now);
      await fingerprinter.fingerprint(fileName);
    });
  });

  test('indicates when no dependency is modified', async () => {
    const depends = await new Depends(appMapDir)
      .baseDir(join(appMapDir, 'src'))
      .depends();
    expect(depends).toEqual([]);
  });

  test('indicates when a dependency is modified', async () => {
    const future = now + 1000;
    utimesSync(userModelFilePath, future, future);

    const depends = await new Depends(appMapDir)
      .baseDir(join(appMapDir, 'src'))
      .depends();
    expect(depends).toEqual([join(join(appMapDir), 'user_page_scenario')]);
  });

  test('indicates dependencies in an explicit list', async () => {
    const depends = await new Depends(appMapDir)
      .files(['app/models/user.rb'])
      .depends();
    expect(depends).toEqual([join(join(appMapDir), 'user_page_scenario')]);
  });
});
