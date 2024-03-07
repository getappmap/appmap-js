import { join, resolve } from 'node:path';
import { BinaryPath } from '.';
import { run } from '../../../src/cmds/agentInstaller/commandRunner';
import CommandStruct from '../../../src/cmds/agentInstaller/commandStruct';
import { stat } from 'node:fs/promises';
import { exit } from 'node:process';
import { log } from 'console';
import chalk from 'chalk';
import { platform } from 'node:os';

const packageRoot = join(__dirname, '..', '..', '..');
const oneDayAgo = Date.now() - 1000 * 60 * 60 * 24;

// jest.setTimeout(1000 * 60 * 5);

export default async function performSetup() {
  if (process.env.SKIP_BUILD_NATIVE) {
    return;
  }

  try {
    const stats = await stat(BinaryPath);
    if (stats.mtimeMs > oneDayAgo) {
      log(chalk.green('The appmap binary has been built within 24h and will not be rebuilt.'));
      log('To force a rebuild, delete ' + resolve(BinaryPath));
      return;
    }
  } catch {
    log('Binary not found');
  }

  log(chalk.yellow('Building native appmap binary. This may take a while.'));
  log(`To skip this step, set the ${chalk.green('SKIP_BUILD_NATIVE')} environment variable.`);

  const startTime = Date.now();
  try {
    await run(
      new CommandStruct(
        'yarn',
        [
          'pkg',
          '--config',
          'package.json',
          '--compress',
          'GZip',
          '-o',
          'release/appmap',
          '-t',
          `node18-${platform()}-x64`,
          'built/cli.js',
        ],
        packageRoot,
        {}
      )
    );
  } catch (err) {
    log(chalk.red('Error building binary'));
    log(err);
    exit(1);
  }

  log(`${chalk.green('Binary built')} in ${(Date.now() - startTime) / 1000} seconds`);
}
