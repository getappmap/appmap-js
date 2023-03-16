import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import { mkdtemp, rmdir, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export default async function runTests(baseCommand: string, testFiles: string[]) {
  const injectTestFiles = (): string | undefined => {
    if (!baseCommand.includes('{testFiles}')) return;

    const [prefix, suffix] = baseCommand.split('{testFiles}');
    return [prefix, testFiles.join(' '), suffix].join('');
  };

  const argumentTestFiles = async (): Promise<string> => {
    const tempDir = await mkdtemp(join(tmpdir(), 'appmap_'));

    process.on('exit', () => rmdir(tempDir, { recursive: true }));

    await writeFile(join(tempDir, 'added'), testFiles.join('\n'));

    return [baseCommand, join(tempDir, 'added')].join(' ');
  };

  const command = injectTestFiles() || (await argumentTestFiles());

  console.log(chalk.magenta(`Running tests: ${command}`));

  return new Promise<void>((resolve) => {
    const cmd = spawn(command.split(' ')[0], command.split(' ').slice(1));
    cmd.stderr.pipe(process.stderr);
    cmd.stdout.pipe(process.stdout);
    cmd.on('close', (code) => {
      if (code) {
        console.error(chalk.red(`Test command failed (${code})`));
      }

      resolve();
    });
  });
}
