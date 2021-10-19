import fs from 'fs';
import { join, resolve } from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { ValidationError } from '../errors';
import AgentInstaller from './agentInstaller';
import UI from '../userInteraction';
import { run, runSync } from './commandRunner';
import { validateConfig } from '../../service/config/validator';
import CommandStruct from './commandStruct';

export default abstract class AgentProcedure {
  constructor(
    readonly installers: readonly AgentInstaller[],
    readonly path: string
  ) {}

  async availableInstallers(): Promise<AgentInstaller[]> {
    const results = await Promise.all(
      this.installers.map(async (installer) => await installer.available())
    );

    return this.installers.filter((_, i) => results[i]);
  }

  async getInstallersForProject() {
    const availableInstallers = await this.availableInstallers();
    if (availableInstallers.length === 0) {
      const longestInstallerName = Math.max(
        ...this.installers.map((i) => i.name.length)
      );

      throw new ValidationError(
        [
          `No supported project was found in ${chalk.red(resolve(this.path))}.`,
          '',
          'The installation requirements for each project type are listed below:',
          this.installers
            .map(
              (i) =>
                `${chalk.blue(
                  i.name.padEnd(longestInstallerName + 2, ' ')
                )} ${chalk.yellow(`${i.buildFile} not found`)}`
            )
            .filter(Boolean)
            .join('\n'),
          '',
          `At least one of the requirements above must be satisfied to continue.`,
          '',
          `Change the current directory or specify a different directory as the last argument to this command.`,
          `Use ${chalk.blue('--help')} for more information.`,
        ].join('\n')
      );
    }
    return availableInstallers;
  }

  async getEnvironmentForDisplay(installer): Promise<string[]> {
    let env = {
      'Project type': installer.name,
      'Project directory': resolve(this.path),
    };

    let gitRemote;
    try {
      const stdout = runSync(new CommandStruct('git', ['remote', '-v'], installer.path));
      if (stdout.length > 0) {
        gitRemote = stdout.split('\n')[0];
      }
      else {
        gitRemote = '[no remote]';
      }
    }
    catch (e) {
      const gitError = (e as Error).message.split('\n')[1];
      gitRemote = `[git remote failed, ${gitError}]`;
    }

    env['Git remote'] = gitRemote;

    if (installer.environment) {
      env = { ...env, ...(await installer.environment()) };
    }
    return Object.entries(env)
      .filter(([_, value]) => Boolean(value))
      .map(([key, value]) => `  ${chalk.blue(key)}: ${value.trim()}`);
  }

  async chooseInstaller(
    availableInstallers: AgentInstaller[]
  ): Promise<AgentInstaller> {
    const { installerName } = await UI.prompt({
      type: 'list',
      name: 'installerName',
      message: `Multiple project types were found in ${chalk.blue(
        resolve(this.path)
      )}. Select one to continue.`,
      choices: availableInstallers.map((i) => i.name),
    });

    const installer = availableInstallers.find((i) => i.name === installerName);
    return installer!;
  }

  async verifyProject(installer) {
    if (installer.verifyCommand) {
      await installer.verifyCommand().then(run);
    }
  }

  async validateAgent(cmd) {
    let stdout, stderr;
    try {
      return run(cmd);
    } catch (e) {
      UI.error('Failed to validate the installation.');
      throw e;
    }
  }

  async validateProject(installer, checkSyntax) {
    if (!installer.validateAgentCommand) {
      return;
    }

    UI.status = 'Validating the AppMap agent...';

    const validateCmd = await installer.validateAgentCommand();
    let { stdout } = await this.validateAgent(validateCmd);
    
    const validationResult = JSON.parse(stdout);

    const errors = Array.isArray(validationResult) ? validationResult : validationResult.errors;
    if (errors.length > 0) {
      throw new ValidationError(errors.map((e) => {
        let msg = e.message;
        if (e.detailed_message) {
          msg += `, ${e.detailed_message}`;
        }
        return msg;
      }).join('\n'));
    }

    const schema = JSON.parse(stdout)['schema'];
    // If appmap-agent-validate returned a schema, and we're using an
    // existing appmap.yml, verify that the config matches the schema.
    if (schema && checkSyntax) {
      UI.status = `Checking the syntax of AppMap agent configuration...`;
      const config = this.loadConfig();
      const result = validateConfig(schema, config);
      if (!result.valid) {
        const errors = result.errors!;
        const lines = errors.cli.split('\n').slice(2, 4);

        // type in IOutputError is wrong, says the member is called dataPath?
        lines[1] += ` (${errors.js[0]['path']})`;

        throw new ValidationError(`\n${this.configPath}:\n${lines.join('\n')}`);
      }
    }
  }

  loadConfig() {
    // yaml.load returns undefined if the input string is empty
    return yaml.load(fs.readFileSync(this.configPath)) || {};
  }

  get configExists(): boolean {
    return fs.existsSync(this.configPath);
  }

  get configPath(): fs.PathLike {
    return resolve(join(this.path, 'appmap.yml'));
  }
}
