import { ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
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

export async function buildRubyProject(): Promise<string> {
  const projectPath = join(tmpdir(), `test-appmap-project-${Date.now()}`);
  const srcPath = join(projectPath, 'src');
  await mkdir(srcPath, { recursive: true });
  await writeFile(join(projectPath, 'Gemfile'), 'source "https://rubygems.org"\n');
  await writeFile(join(srcPath, 'main.rb'), 'puts "Hello, world!"');
  return projectPath;
}
