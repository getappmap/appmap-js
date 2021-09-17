/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import { join } from 'path';
import { promises as fsp } from 'fs';
import AgentInstaller from './agentInstaller';
import CommandStruct from './commandStruct';
import { exists } from '../../utils';
import chalk from 'chalk';
import { run } from './commandRunner';
import { getOutput } from './commandUtil';

const REGEX_PKG_DEPENDENCY = /^\s*appmap\s*[=>~]+=.*$/m;
// include .dev0 so pip will allow prereleases
const PKG_DEPENDENCY = 'appmap>=1.1.0.dev0';

abstract class PythonInstaller {
  constructor(readonly path: string) {}

  get documentation() {
    return 'https://appland.com/docs/reference/appmap-python';
  }

  async environment(): Promise<Record<string, string>> {
    // Python version is returned as a string similar to:
    // Python 3.7.0
    const version = await getOutput('python', ['--version'], this.path);
    const pythonPath = await getOutput(
      'python',
      ['-c', 'import sys; print(sys.prefix)'],
      this.path
    );

    return {
      'Python version': version.ok
        ? version.output.split(/\s/)[1]
        : chalk.red(version.output),
      'Python package directory': pythonPath.ok
        ? pythonPath.output
        : chalk.red(pythonPath.output),
    };
  }
}

export class PoetryInstaller extends PythonInstaller implements AgentInstaller {
  constructor(readonly path: string) {
    super(path);
  }

  get name(): string {
    return 'poetry';
  }

  get buildFile(): string {
    return 'poetry.lock';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async postInstallMessage(): Promise<string> {
    return [
      `Run your tests with ${chalk.blue('APPMAP=true')} in the environment.`,
      `By default, AppMap files will be output to ${chalk.blue('tmp/appmap')}.`,
    ].join('\n');
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  async initCommand(): Promise<CommandStruct> {
    return new CommandStruct('poetry', ['run', 'appmap-agent-init'], this.path);
  }

  async installAgent(): Promise<void> {
    const cmd = new CommandStruct(
      'poetry',
      ['add', '--dev', '--allow-prereleases', 'appmap'],
      this.path
    );

    await run(cmd);
  }
}

export class PipInstaller extends PythonInstaller implements AgentInstaller {
  constructor(readonly path: string) {
    super(path);
  }

  get name(): string {
    return 'pip';
  }

  get buildFile(): string {
    return 'requirements.txt';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async postInstallMessage(): Promise<string> {
    return [
      `Run your tests with ${chalk.blue('APPMAP=true')} in the environment.`,
      `By default, AppMap files will be output to ${chalk.blue('tmp/appmap')}.`,
    ].join('\n');
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  async installAgent(): Promise<void> {
    let requirements = (await fsp.readFile(this.buildFilePath)).toString();

    const pkgExists = requirements.search(REGEX_PKG_DEPENDENCY) !== -1;

    if (pkgExists) {
      // Replace the existing package declaration entirely.
      requirements = requirements.replace(REGEX_PKG_DEPENDENCY, PKG_DEPENDENCY);
    } else {
      // Insert a new package declaration.
      // eslint-disable-next-line prefer-template
      requirements = `${PKG_DEPENDENCY}\n` + requirements;
    }

    await fsp.writeFile(this.buildFilePath, requirements);

    const cmd = new CommandStruct(
      'pip',
      ['install', '-r', this.buildFile],
      this.path
    );
    await run(cmd);
  }

  async initCommand(): Promise<CommandStruct> {
    return new CommandStruct('appmap-agent-init', [], this.path);
  }
}
