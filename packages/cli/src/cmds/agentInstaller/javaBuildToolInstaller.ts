import glob from 'glob';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import CommandStruct from './commandStruct';
import { run } from './commandRunner';
import { getOutput } from './commandUtil';
import { findIntelliJHome } from './jetBrainsSupport';
import AgentInstaller from './agentInstaller';
import InstallerUI from './installerUI';

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

  async initCommand(ui: InstallerUI): Promise<CommandStruct> {
    return new CommandStruct(
      'Initializing the appmap-agent JAR configuration',
      'java',
      ['-jar', await this.agentJar(ui), '-d', this.path, 'init'],
      this.path
    );
  }

  async validateAgentCommand(ui: InstallerUI): Promise<CommandStruct> {
    return new CommandStruct(
      'Validating that the appmap-agent JAR is successfully installed and configured',
      'java',
      ['-jar', await this.agentJar(ui), '-d', this.path, 'validate'],
      this.path
    );
  }

  private async agentJar(ui: InstallerUI): Promise<string> {
    if (!this._agentJar) {
      const cmd = await this.printJarPathCommand();
      const { stdout } = await run(ui, cmd);

      this._agentJar = stdout
        .split('\n')
        .filter((l) => l.match(/^com\.appland:appmap-agent\.jar.path/))[0]
        .split('=')[1];
    }

    return this._agentJar!.trim();
  }

  async environment(ui: InstallerUI): Promise<Record<string, string>> {
    // JDK version is returned as a string similar to:
    // javac 1.8.0_212-internal (build 1.8.0_212-internal+11)
    const version = await getOutput(
      ui,
      `Detect the Java version to ensure it's compatible with AppMap`,
      'javac',
      ['-version'],
      this.path
    );
    return {
      JAVA_HOME: process.env['JAVA_HOME'] || chalk.yellow('Unspecified'),
      'JDK Version': version.ok ? version.output.split(/\s/)[1] : chalk.red(version.output),
    };
  }
}
