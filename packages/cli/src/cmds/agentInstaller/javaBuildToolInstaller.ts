import glob from 'glob';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import CommandStruct from '../../commandStruct';
import { run } from '../../commandRunner';
import { getOutput } from './commandUtil';
import { findIntelliJHome } from './jetBrainsSupport';
import AgentInstaller from './agentInstaller';

export function addJetBrainsEnv() {
  const jbHome = findIntelliJHome();
  if (!jbHome) {
    return;
  }

  const javaHome = path.join(jbHome, 'jbr');
  const mvnBin = path.join(jbHome, 'plugins/maven/lib/maven3/bin');

  // Make sure we don't override the user's settings: append to path, use the
  // existing JAVA_HOME if it's set.
  if (!process.env['JAVA_HOME']) {
    process.env['JAVA_HOME'] = javaHome;
  }
  process.env['PATH'] = [process.env['PATH'], path.join(javaHome, 'bin'), mvnBin].join(
    path.delimiter
  );
}
addJetBrainsEnv();

export default abstract class JavaBuildToolInstaller extends AgentInstaller {
  private _agentJar?: string;

  protected abstract printJarPathCommand(): Promise<CommandStruct>;
  protected constructor(name: string, path: string) {
    super(name, path);
  }

  get documentation(): string {
    return 'https://appland.com/docs/reference/appmap-java';
  }

  async initCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      'java',
      ['-jar', await this.agentJar(), '-d', this.path, 'init'],
      this.path
    );
  }

  async validateAgentCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      'java',
      ['-jar', await this.agentJar(), '-d', this.path, 'validate'],
      this.path
    );
  }

  private async agentJar(): Promise<string> {
    if (!this._agentJar) {
      const cmd = await this.printJarPathCommand();
      const { stdout } = await run(cmd);

      this._agentJar = stdout
        .split('\n')
        .filter((l) => l.match(/^com\.appland:appmap-agent\.jar.path/))[0]
        .split('=')[1];
    }

    return this._agentJar!.trim();
  }

  async environment(): Promise<Record<string, string>> {
    // JDK version is returned as a string similar to:
    // javac 1.8.0_212-internal (build 1.8.0_212-internal+11)
    const version = await getOutput('javac', ['-version'], this.path);
    return {
      JAVA_HOME: process.env['JAVA_HOME'] || chalk.yellow('Unspecified'),
      'JDK Version': version.ok ? version.output.split(/\s/)[1] : chalk.red(version.output),
    };
  }
}
