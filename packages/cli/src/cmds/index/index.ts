import readline from 'readline';
import yargs from 'yargs';

import FingerprintDirectoryCommand from '../../fingerprint/fingerprintDirectoryCommand';
import FingerprintWatchCommand from '../../fingerprint/fingerprintWatchCommand';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { verbose } from '../../utils';

export const command = 'index';
export const describe =
  'Compute fingerprints and update index files for all appmaps in a directory';

export const builder = (args: yargs.Argv) => {
  args.showHidden();

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });
  args.option('watch', {
    describe: 'watch the directory for changes to appmaps',
    boolean: true,
  });
  args.options('watch-stat-delay', {
    type: 'number',
    default: 10,
    describe: 'delay between stat calls when watching, in milliseconds',
    hidden: true,
  });
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);

  const { watchStatDelay } = argv;

  if (argv.watch) {
    const cmd = new FingerprintWatchCommand(appmapDir);
    await cmd.execute(watchStatDelay);

    if (!argv.verbose && process.stdout.isTTY) {
      process.stdout.write('\x1B[?25l');
      const consoleLabel = 'AppMaps processed: 0';
      process.stdout.write(consoleLabel);
      setInterval(() => {
        readline.cursorTo(process.stdout, consoleLabel.length - 1);
        process.stdout.write(`${cmd.numProcessed}`);
      }, 1000);

      process.on('beforeExit', (/* _code */) => {
        process.stdout.write(`\x1B[?25h`);
      });
    }
  } else {
    const cmd = new FingerprintDirectoryCommand(appmapDir);
    await cmd.execute();
  }
};
