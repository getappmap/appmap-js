/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import chalk from 'chalk';
import os from 'os';
import { join } from 'path';
import semver from 'semver';
import EncodedFile from '../../encodedFile';
import { exists } from '../../utils';
import { UserConfigError } from '../errors';
import AgentInstaller from './agentInstaller';
import { run } from './commandRunner';
import CommandStruct from './commandStruct';
import { getOutput } from './commandUtil';

const REGEX_PKG_DEPENDENCY = /^\s*appmap\s*[=>~]+=.*$/m;
// include .dev0 so pip will allow prereleases
const PKG_DEPENDENCY = 'appmap>=1.1.0.dev0';

abstract class PythonInstaller extends AgentInstaller {
  constructor(name: string, path: string) {
    super(name, path);
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
      'Python version': version.ok ? version.output.split(/\s/)[1] : chalk.red(version.output),
      'Python package directory': pythonPath.ok ? pythonPath.output : chalk.red(pythonPath.output),
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
    return exists(this.buildFilePath);
  }

  async initCommand(): Promise<CommandStruct> {
    return new CommandStruct('poetry', ['run', 'appmap-agent-init'], this.path);
  }

  async checkConfigCommand(): Promise<CommandStruct | undefined> {
    return new CommandStruct('poetry', ['install', '--dry-run'], this.path);
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

export class PipenvInstaller extends PythonInstaller {
  constructor(path: string) {
    super('pipenv', path);
  }

  get buildFile(): string {
    return 'Pipfile.lock';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async available(): Promise<boolean> {
    const ret = await exists(this.buildFilePath);
    return ret;
  }

  async initCommand(): Promise<CommandStruct> {
    return new CommandStruct('pipenv', ['run', 'appmap-agent-init'], this.path);
  }

  async checkConfigCommand(): Promise<CommandStruct | undefined> {
    return new CommandStruct('pipenv', ['install', '--dev'], this.path);
  }

  async installAgent(): Promise<void> {
    const cmd = new CommandStruct('pipenv', ['install', '--dev', '--pre', 'appmap'], this.path);

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
    return exists(this.buildFilePath);
  }

  async checkConfigCommand(): Promise<CommandStruct | undefined> {
    let commandArgs = ['install', '-r', this.buildFile];
    let supportsDryRun: boolean;

    try {
      const pipVersionOutput = await getOutput('pip', ['--version'], this.path);
      const pipVersion = semver.coerce(pipVersionOutput.output);

      if (!pipVersion) {
        throw new UserConfigError('Could not detect pip version');
      }

      supportsDryRun = semver.satisfies(pipVersion, '>= 22.2.0');
    } catch (err) {
      throw new UserConfigError(err as string);
    }

    if (supportsDryRun) {
      commandArgs.push('--dry-run');
    }

    return new CommandStruct('pip', commandArgs, this.path);
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

    const cmd = new CommandStruct('pip', ['install', '-r', this.buildFile], this.path);
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
