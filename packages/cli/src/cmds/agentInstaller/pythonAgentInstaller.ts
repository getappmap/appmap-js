/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import chalk from 'chalk';
import { glob } from 'glob';
import minimatch from 'minimatch';
import os from 'os';
import { basename, join } from 'path';
import semver from 'semver';
import { promisify } from 'util';
import EncodedFile from '../../encodedFile';
import { exists, isFile } from '../../utils';
import { UserConfigError } from '../errors';
import UI from '../userInteraction';
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
    const version = await getOutput('python3', ['--version'], this.path);
    const pythonPath = await getOutput(
      'python3',
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
  static identifier = 'poetry';

  constructor(path: string) {
    super(PoetryInstaller.identifier, path);
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
  static identifier = 'pipenv';

  constructor(path: string) {
    super(PipenvInstaller.identifier, path);
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
  static identifier = 'pip';
  private _buildFile: string = 'requirements.txt';

  constructor(path: string) {
    super(PipInstaller.identifier, path);
  }

  get buildFile(): string {
    return this._buildFile;
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async available(): Promise<boolean> {
    return isFile(this.buildFilePath);
  }

  private async findBuildFiles(): Promise<string[]> {
    const choices = await promisify(glob)('*requirements*.txt', {
      matchBase: true,
      cwd: this.path,
      nodir: true,
    });

    return choices;
  }

  private async chooseBuildFile(choices): Promise<string> {
    const defaultChoice = choices.filter((f) => minimatch(f, '*dev*', { matchBase: true }));

    const { buildFile } = await UI.prompt([
      {
        type: 'list',
        name: 'buildFile',
        message: 'Please choose the requirements file used for development:',
        choices,
        default: defaultChoice[0],
      },
    ]);

    return basename(buildFile);
  }

  async checkConfigCommand(): Promise<CommandStruct | undefined> {
    const choices = await this.findBuildFiles();

    if (choices.length === 1) {
      choices[0];
    } else {
      UI.progress(`

This project contains multiple Pip requirements files. AppMap should only be
installed during development and testing, not when deploying in a production
environment.
`);
      this._buildFile = await this.chooseBuildFile(choices);
    }

    let commandArgs = ['-m', 'pip', 'install', '-r', this.buildFile];
    let supportsDryRun: boolean;

    try {
      const pipVersionOutput = await getOutput('python3', ['-m', 'pip', '--version'], this.path);
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

    return new CommandStruct('python3', commandArgs, this.path);
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
      'python3',
      ['-m', 'pip', 'install', '-r', this.buildFile],
      this.path
    );
    await run(cmd);
  }

  async initCommand(): Promise<CommandStruct> {
    return new CommandStruct('python3', ['-m', 'appmap.command.appmap_agent_init'], this.path);
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
