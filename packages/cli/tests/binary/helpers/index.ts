import { ChildProcess, spawn } from 'node:child_process';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { run } from '../../../src/cmds/agentInstaller/commandRunner';
import CommandStruct, { CommandReturn } from '../../../src/cmds/agentInstaller/commandStruct';

export const BinaryPath = join(__dirname, '..', '..', '..', 'release', 'appmap');

export function runUntilCompletion(args: string[], cwd = process.cwd()): Promise<CommandReturn> {
  return run(
    new CommandStruct(BinaryPath, args, cwd, {
      APPMAP_TELEMETRY_DISABLED: '1',
    })
  );
}

export function runInBackground(args: string[], cwd = process.cwd()): ChildProcess {
  return spawn(BinaryPath, args, {
    cwd,
    env: {
      APPMAP_TELEMETRY_DISABLED: '1',
    },
  });
}

export function waitForStdout(
  childProcess: ChildProcess,
  regex: string | RegExp,
  timeout = 10_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!childProcess.stdout) return reject(new Error('No stdout'));

    let buffer = '';
    const timeoutId = setTimeout(() => {
      childProcess.kill();
      reject(new Error('Timeout waiting for stdout:\n' + buffer));
    }, timeout);

    childProcess.stderr?.on('data', (data) => {
      buffer += data.toString();
    });
    childProcess.stdout.on('data', (data) => {
      const str = data.toString();
      buffer += str;
      const match = str.match(regex);
      if (match) {
        clearTimeout(timeoutId);
        resolve(match[1]);
      }
    });
  });
}

export async function buildRubyProject(): Promise<string> {
  const projectPath = join(tmpdir(), `test-appmap-project-${Date.now()}`);
  const srcPath = join(projectPath, 'src');
  const appMapDir = join(projectPath, 'tmp', 'appmap');

  await mkdir(srcPath, { recursive: true });
  await mkdir(appMapDir, { recursive: true });

  await writeFile(join(projectPath, 'Gemfile'), 'source "https://rubygems.org"\n');
  await writeFile(join(srcPath, 'main.rb'), 'puts "Hello, world!"');
  await writeFile(
    join(projectPath, 'appmap.yml'),
    [
      'name: test-appmap-project',
      'language: ruby',
      'appmap_dir: tmp/appmap',
      'packages:',
      '  - src',
    ].join('\n')
  );

  await copyFile(
    join(__dirname, '../../unit/fixtures/ruby/revoke_api_key.appmap.json'),
    join(appMapDir, 'revoke_api_key.appmap.json')
  );
  return projectPath;
}
