/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import os from 'os';
import { join } from 'path';
import AgentInstaller from './agentInstaller';
import CommandStruct from './commandStruct';
import { exists } from '../../utils';
import chalk from 'chalk';
import { run } from './commandRunner';
import { getOutput } from './commandUtil';
import EncodedFile from '../../encodedFile';

const REGEX_PKG_DEPENDENCY = /^\s*appmap\s*[=>~]+=.*$/m;
// include .dev0 so pip will allow prereleases
const PKG_DEPENDENCY = 'appmap>=1.1.0.dev0';

abstract class PythonInstaller extends AgentInstaller {
  constructor(name: string, path: string) {
    super(name, path);
  }

  get language(): string {
    return 'python';
  }

  get appmap_dir(): string {
    return 'tmp/appmap';
  }

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

export class PoetryInstaller extends PythonInstaller {
  constructor(path: string) {
    super('poetry', path);
  }

  get buildFile(): string {
    return 'poetry.lock';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
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

  async verifyCommand() {
    return undefined;
  }

  async validateCommand() {
    return undefined;
  }

  async validateAgentCommand() {
    return undefined;
  }
}

export class PipInstaller extends PythonInstaller {
  constructor(path: string) {
    super('pip', path);
  }

  get buildFile(): string {
    return 'requirements.txt';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  async installAgent(): Promise<void> {
    const encodedFile: EncodedFile = new EncodedFile(this.buildFilePath);
    let requirements = encodedFile.toString();

    const pkgExists = requirements.search(REGEX_PKG_DEPENDENCY) !== -1;

    if (pkgExists) {
      // Replace the existing package declaration entirely.
      requirements = requirements.replace(REGEX_PKG_DEPENDENCY, PKG_DEPENDENCY);
    } else {
      // Insert a new package declaration.
      // eslint-disable-next-line prefer-template
      requirements = PKG_DEPENDENCY + os.EOL + requirements;
    }

    encodedFile.write(requirements);

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

  async verifyCommand() {
    return undefined;
  }

  async validateCommand() {
    return undefined;
  }

  async validateAgentCommand() {
    return undefined;
  }
}
