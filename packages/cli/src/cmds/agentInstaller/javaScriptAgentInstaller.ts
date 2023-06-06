import { exists } from '../../utils';
import { getOutput } from './commandUtil';
import { join } from 'path';
import { run } from './commandRunner';
import AgentInstaller from './agentInstaller';
import chalk from 'chalk';
import CommandStruct from './commandStruct';
import { UserConfigError } from '../errors';
import semver from 'semver';
import InstallerUI from './installerUI';

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

  async environment(ui: InstallerUI): Promise<Record<string, string>> {
    const version = await getOutput(
      ui,
      `Detect the Node.js version to ensure it's compatible with AppMap`,
      'node',
      ['--version'],
      this.path
    );

    return {
      'Node version': version.ok ? version.output.split(/\s/)[1] : chalk.red(version.output),
    };
  }

  async initCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      'Initializing the appmap-agent-js configuration',
      'npx',
      ['@appland/appmap-agent-js', 'init', this.path],
      this.path
    );
  }

  async validateAgentCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      'Validating that the appmap-agent-js is successfully installed and configured',
      'npx',
      ['@appland/appmap-agent-js', 'status', this.path],
      this.path
    );
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

  async checkConfigCommand(_ui: InstallerUI): Promise<CommandStruct | undefined> {
    return new CommandStruct(
      'Verify that the npm project is valid',
      'npm',
      ['install', '--dry-run'],
      this.path
    );
  }

  async installAgent(ui: InstallerUI): Promise<void> {
    const cmd = new CommandStruct(
      'Add the appmap package to your project using npm',
      'npm',
      ['install', '--saveDev', process.env.APPMAP_AGENT_PACKAGE || AGENT_PACKAGE],
      this.path
    );

    await run(ui, cmd);
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

  async checkConfigCommand(_ui: InstallerUI): Promise<CommandStruct | undefined> {
    return new CommandStruct(
      'Verify that the yarn project is valid',
      'yarn',
      ['install', '--immutable'],
      this.path
    );
  }

  async installAgent(ui: InstallerUI): Promise<void> {
    const cmd = new CommandStruct(
      'Add the appmap package to your project using yarn',
      'yarn',
      ['add', '--dev', process.env.APPMAP_AGENT_PACKAGE || AGENT_PACKAGE],
      this.path
    );

    await run(ui, cmd);
  }

  async verifyCommand() {
    return undefined;
  }

  async isYarnVersionOne(ui: InstallerUI): Promise<boolean> {
    let isVersionOne: boolean;
    try {
      const versionOutput = await getOutput(
        ui,
        `Detect the yarn version to ensure it's compatible with AppMap`,
        'yarn',
        ['--version'],
        this.path
      );
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
