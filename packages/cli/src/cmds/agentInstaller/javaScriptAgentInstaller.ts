import { exists } from '@appland/common/src/utils';
import { getOutput } from './commandUtil';
import { join } from 'path';
import { run } from '@appland/common/src/commandRunner';
import AgentInstaller from './agentInstaller';
import chalk from 'chalk';
import CommandStruct from '@appland/common/src/commandStruct';
import { UserConfigError } from '@appland/common/src/errors';
import semver from 'semver';

const AGENT_PACKAGE = '@appland/appmap-agent-js@latest';

abstract class JavaScriptInstaller extends AgentInstaller {
  constructor(name: string, path: string) {
    super(name, path);
  }

  get language(): string {
    return 'javascript';
  }

  get appmap_dir(): string {
    return 'tmp/appmap';
  }

  get documentation() {
    return 'https://appland.com/docs/reference/appmap-agent-js';
  }

  async environment(): Promise<Record<string, string>> {
    const version = await getOutput('node', ['--version'], this.path);

    return {
      'Node version': version.ok ? version.output.split(/\s/)[1] : chalk.red(version.output),
    };
  }

  async initCommand(): Promise<CommandStruct> {
    return new CommandStruct('npx', ['@appland/appmap-agent-js', 'init', this.path], this.path);
  }

  async validateAgentCommand(): Promise<CommandStruct> {
    return new CommandStruct('npx', ['@appland/appmap-agent-js', 'status', this.path], this.path);
  }
}

export class NpmInstaller extends JavaScriptInstaller {
  static identifier = 'npm';

  constructor(path: string) {
    super(NpmInstaller.identifier, path);
  }

  get buildFile(): string {
    return 'package-lock.json';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  async checkConfigCommand(): Promise<CommandStruct | undefined> {
    return new CommandStruct('npm', ['install', '--dry-run'], this.path);
  }

  async installAgent(): Promise<void> {
    const cmd = new CommandStruct(
      'npm',
      ['install', '--saveDev', process.env.APPMAP_AGENT_PACKAGE || AGENT_PACKAGE],
      this.path
    );

    await run(cmd);
  }

  async verifyCommand() {
    return undefined;
  }
}

export class YarnInstaller extends JavaScriptInstaller {
  static identifier = 'yarn';

  constructor(path: string) {
    super(YarnInstaller.identifier, path);
  }

  get buildFile(): string {
    return 'yarn.lock';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  async checkConfigCommand(): Promise<CommandStruct | undefined> {
    return new CommandStruct('yarn', ['install', '--immutable'], this.path);
  }

  async installAgent(): Promise<void> {
    const cmd = new CommandStruct(
      'yarn',
      ['add', '--dev', process.env.APPMAP_AGENT_PACKAGE || AGENT_PACKAGE],
      this.path
    );

    await run(cmd);
  }

  async verifyCommand() {
    return undefined;
  }

  async isYarnVersionOne(): Promise<boolean> {
    let isVersionOne: boolean;
    try {
      const versionOutput = await getOutput('yarn', ['--version'], this.path);
      const version = semver.coerce(versionOutput.output);

      if (!version) {
        throw new UserConfigError('Could not detect yarn version');
      }

      isVersionOne = !semver.satisfies(version, '>= 2.0.0');
    } catch (err) {
      throw new UserConfigError(err as string);
    }

    return isVersionOne;
  }
}
