import process from 'node:process';
import showAppMap from '../../../../src/cmds/open/showAppMap';
import * as openers from '../../../../src/cmds/open/openers';
import { spawn } from 'child_process';
import UI from '../../../../src/cmds/userInteraction';

const realPlatform = jest.requireActual('node:process').platform;

describe(showAppMap, () => {
  it('opens the appmap in the browser', async () => {
    const openInBrowser = jest.spyOn(openers, 'openInBrowser').mockResolvedValue();
    await showAppMap(testPath);
    expect(openInBrowser.mock.calls).toStrictEqual([[testPath, false]]);
  });

  describe('on darwin in VSCode', () => {
    beforeEach(() => {
      jest.replaceProperty(process, 'env', { TERM_PROGRAM: 'vscode' });
      jest.replaceProperty(process, 'platform', 'darwin');
    });

    if (realPlatform !== 'win32')
      it('tries to open the appmap in VSCode', async () => {
        await showAppMap(testPath);
        expect(jest.mocked(spawn).mock.calls).toStrictEqual([['code', ['/test/map.appmap.json']]]);
      });

    it('opens in browser on failure', async () => {
      jest.mocked(spawn).mockImplementation(() => {
        throw new Error('test spawn error');
      });
      const openInBrowser = jest.spyOn(openers, 'openInBrowser').mockResolvedValue();
      await showAppMap(testPath);
      expect(openInBrowser.mock.calls).toStrictEqual([[testPath, false]]);
    });
  });
});

jest
  .mock('../../../../src/cmds/userInteraction')
  .mock('child_process')
  .mock('node:process', () => ({
    cwd: () => '/test',
    env: {},
    platform: 'darwin',
  }));

beforeEach(() => {
  jest.mocked(UI.prompt).mockResolvedValue({ action: 'test' });
});

const testPath = 'map.appmap.json';
