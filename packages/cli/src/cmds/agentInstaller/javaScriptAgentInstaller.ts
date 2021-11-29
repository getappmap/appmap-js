import { exists } from '../../utils';
import { getOutput } from './commandUtil';
import { join } from 'path';
import { run } from './commandRunner';
import AgentInstaller from './agentInstaller';
import chalk from 'chalk';
import CommandStruct from './commandStruct';

const AGENT_PACKAGE = '@appland/appmap-agent-js@latest';

abstract class JavaScriptInstaller {
  constructor(readonly path: string) {}

  get documentation() {
    return 'https://appland.com/docs/reference/appmap-agent-js';
  }

  async environment(): Promise<Record<string, string>> {
    const version = await getOutput('node', ['--version'], this.path);

    return {
      'Node version': version.ok
        ? version.output.split(/\s/)[1]
        : chalk.red(version.output),
    };
  }

  async initCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      'npx',
      ['appmap-agent-js', 'init', this.path],
      this.path
    );
  }

  async validateAgentCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      'npx',
      ['appmap-agent-js', 'status', this.path],
      this.path
    );
  }
}

export class NpmInstaller
  extends JavaScriptInstaller
  implements AgentInstaller
{
  constructor(readonly path: string) {
    super(path);
  }

  get name(): string {
    return 'npm';
  }

  get buildFile(): string {
    return 'package-lock.json';
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
    const cmd = new CommandStruct(
      'npm',
      ['install', '--saveDev', AGENT_PACKAGE],
      this.path
    );

    await run(cmd);
  }
}

export class YarnInstaller
  extends JavaScriptInstaller
  implements AgentInstaller
{
  constructor(readonly path: string) {
    super(path);
  }

  get name(): string {
    return 'yarn';
  }

  get buildFile(): string {
    return 'yarn.lock';
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
    const cmd = new CommandStruct(
      'yarn',
      ['add', '--dev', AGENT_PACKAGE],
      this.path
    );

    await run(cmd);
  }
}
