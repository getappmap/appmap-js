import chalk from 'chalk';
import CommandStruct from './commandStruct';
import { run } from './commandRunner';
import { getOutput } from './commandUtil';

export abstract class JavaBuildToolInstaller {
  private _agentJar?: string;

  protected abstract printJarPathCommand(): Promise<CommandStruct>;
  protected constructor(readonly path: string) {
    this.path = path;
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

    return this._agentJar!;
  }

  async environment(): Promise<Record<string, string>> {
    // JDK version is returned as a string similar to:
    // javac 1.8.0_212-internal (build 1.8.0_212-internal+11)
    const version = await getOutput('javac', ['-version'], this.path);
    return {
      JAVA_HOME: process.env.JAVA_HOME || chalk.yellow('Unspecified'),
      'JDK Version': version.ok
        ? version.output.split(/\s/)[1]
        : chalk.red(version.output),
    };
  }
}
