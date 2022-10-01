import { Arguments } from 'yargs';
import * as resolveAppId from '../../src/cli/resolveAppId';
import ScanCommand from '../../src/cli/scan/command';
import CommandOptions from '../../src/cli/scan/options';
import * as watchScan from '../../src/cli/scan/watchScan';

const defaultArguments: Arguments<CommandOptions> = {
  _: [],
  $0: 'scan',
  all: false,
  interactive: false,
  watch: false,
  config: 'appmap-scanner.yml',
  reportFile: 'appmap-findings.json',
};

describe('commands', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('scan --watch', () => {
    it('does not attempt to resolve an app ID', async () => {
      // Prevent the watcher from running indefinitely
      jest.spyOn(watchScan, 'default').mockResolvedValue();

      const spy = jest.spyOn(resolveAppId, 'default');

      try {
        await ScanCommand.handler({ ...defaultArguments, watch: true });
      } catch {
        // Do nothing.
        // We don't want exceptions, we just want to know if our stub was called.
      }

      expect(spy).not.toBeCalled();
    });
  });
});
