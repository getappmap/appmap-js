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
import Telemetry from '../../telemetry';

export default abstract class AgentProcedure {
  constructor(readonly installer: AgentInstaller, readonly path: string) {}

  async getEnvironmentForDisplay(): Promise<string[]> {
    // TS is ok with this written as let env:[name: string]: string = {...}, but
    // babel doesn't like it. Splitting it up this way keeps them both happy:
    let env;
    env = {
      'Project type': this.installer.name,
      'Project directory': resolve(this.path),
    };
    if (!Telemetry.enabled) {
      env = {
        '!!! Telemetry disabled !!!': 'true',
        ...env,
      };
    }

    let gitRemote;
    try {
      const stdout = runSync(new CommandStruct('git', ['remote', '-v'], this.installer.path));
      if (stdout.length > 0) {
        gitRemote = stdout.split('\n')[0];
      } else {
        gitRemote = '[no remote]';
      }
    } catch (e) {
      const gitError = (e as Error).message.split('\n')[1];
      gitRemote = `[git remote failed, ${gitError}]`;
    }

    env['Git remote'] = gitRemote;

    if (this.installer.environment) {
      env = { ...env, ...(await this.installer.environment()) };
    }
    return Object.entries(env)
      .filter(([_, value]) => Boolean(value))
      .map(([key, value]) => `  ${chalk.blue(key)}: ${(value as string).trim()}`);
  }

  async verifyProject() {
    const verifyCommand = await this.installer.verifyCommand();
    if (verifyCommand) {
      await run(verifyCommand);
    }
  }

  async validateAgent(cmd) {
    try {
      return run(cmd);
    } catch (e) {
      UI.error('Failed to validate the installation.');
      throw e;
    }
  }

  async validateProject(checkSyntax: boolean) {
    const validateCmd = await this.installer.validateAgentCommand();
    if (!validateCmd) {
      return;
    }

    UI.status = 'Validating the AppMap agent...';

    let { stdout } = await this.validateAgent(validateCmd);

    const validationResult = JSON.parse(stdout);

    const errors = Array.isArray(validationResult) ? validationResult : validationResult.errors;
    if (errors.length > 0) {
      throw new ValidationError(
        errors
          .map((e) => {
            let msg = e.message;
            if (e.detailed_message) {
              msg += `, ${e.detailed_message}`;
            }
            return msg;
          })
          .join('\n')
      );
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

  loadConfig(): Record<string, unknown> {
    // yaml.load returns undefined if the input string is empty
    const configContent = fs.readFileSync(this.configPath, 'utf8');
    return (yaml.load(configContent) as Record<string, unknown>) || {};
  }

  get configExists(): boolean {
    return fs.existsSync(this.configPath);
  }

  get configPath(): fs.PathLike {
    return resolve(join(this.path, 'appmap.yml'));
  }
}
