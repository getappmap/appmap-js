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
import { formatValidationError, parseValidationResult, ValidationResult } from './ValidationResult';
import { GitStatus } from './types/state';

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

  async validateProject(checkSyntax: boolean): Promise<ValidationResult | undefined> {
    const validateCmd = await this.installer.validateAgentCommand();
    if (!validateCmd) {
      return;
    }

    UI.status = 'Validating the AppMap agent...';

    let { stdout } = await this.validateAgent(validateCmd);

    const validationResult = parseValidationResult(stdout);

    const errors = (validationResult.errors || []).filter((e) => e.level === 'error');
    if (errors.length > 0) {
      throw new ValidationError(errors.map(formatValidationError).join('\n'));
    }

    const { schema } = validationResult;
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

    return validationResult;
  }

  async gitStatus(file?: string): Promise<GitStatus[]> {
    let files: GitStatus[] = [];
    let params: string[] = ['status', '-s'];
    if (file !== undefined) {
      params.push(file);
    }
    let stdout = '';
    try {
      stdout = runSync(new CommandStruct('git', params, this.installer.path));
    } catch (e) {
      const gitError = (e as Error).message.split('\n')[1];
      const gitStatus = `[git status failed, ${gitError}]`;
      // may want to print the error
    }

    if (stdout && stdout.length > 0) {
      // git status output looks like this:
      //  M Gemfile
      //  M Gemfile.lock
      // ?? appmap.yml
      const lines = stdout.split('\n');
      for (const line of lines) {
        const gitStatus = line.substring(0, 2);
        const file = line.substring(3);
        files.push({
          file: file,
          status: gitStatus,
        });
      }
    }

    return files;
  }

  async gitAdd(files: string[]): Promise<any> {
    let params: string[] = ['add'];
    for (const file of files) {
      params.push(file);
    }
    try {
      const stdout = runSync(new CommandStruct('git', params, this.installer.path));
      return {
        success: true,
        errorMessage: '',
      };
    } catch (e) {
      const gitError = (e as Error).message.split('\n')[1];
      const gitAdd = `[git add failed, ${gitError}]`;
      // may want to print the error
      return {
        success: false,
        errorMessage: gitAdd,
      };
    }
  }

  async gitCommit(files: string[], commitMessage: string): Promise<any> {
    let params: string[] = ['commit', '-m', commitMessage];
    for (const file of files) {
      params.push(file);
    }
    try {
      const stdout = runSync(new CommandStruct('git', params, this.installer.path));
      return {
        success: true,
        errorMessage: '',
      };
    } catch (e) {
      const gitError = (e as Error).message.split('\n')[1];
      const gitCommit = `[git commit failed, ${gitError}]`;
      // may want to print the error
      return {
        success: false,
        errorMessage: gitCommit,
      };
    }
  }

  async commitConfiguration(filesBefore: string[]) {
    Telemetry.sendEvent({
      name: `install-agent:commit_config:commit_start`,
      properties: {},
    });

    const filesAfterGitStatus: GitStatus[] = await this.gitStatus();
    const filesAfter: string[] = [];
    for (const file of filesAfterGitStatus) {
      filesAfter.push(file.file);
    }
    let filesDiff: string[] = [];
    filesDiff = filesAfter.filter((file) => !filesBefore.includes(file));
    filesDiff.sort();
    let filesDiffText = filesDiff.flat().join('__');
    if (filesDiff.length == 0) {
      Telemetry.sendEvent({
        name: `install-agent:commit_config:should_not_commit`,
        properties: {
          filesDiffText,
        },
      });

      return false;
    }

    Telemetry.sendEvent({
      name: `install-agent:commit_config:should_commit`,
      properties: {
        filesDiffText,
      },
    });

    let filesMessages: string[] = [];
    for (const file of filesDiff) {
      filesMessages.push(`  ${chalk.blue(file)}`);
    }
    const { commit } = await UI.prompt({
      type: 'confirm',
      name: 'commit',
      message: [
        `AppMap recommends you have the installer commit in Git for you the following`,
        `  files, to not have to install AppMap again in this repository:`,
        filesMessages,
        '  ',
        '  Commit?',
      ]
        .flat()
        .join('\n'),
    });

    if (commit) {
      Telemetry.sendEvent({
        name: `install-agent:commit_config:commit_yes`,
        properties: {
          filesDiffText,
        },
      });

      // gitAdd is idempotent, and necessary to add to git appmap.yml,
      // Gemfile.lock etc. when the installer runs for the first time
      const addGitReturn = await this.gitAdd(filesDiff);
      if (!addGitReturn.success) {
        UI.error(addGitReturn.errorMessage);
      }

      const commitGitReturn = await this.gitCommit(filesDiff, 'feat: Install AppMap.');
      if (!commitGitReturn.success) {
        UI.error(commitGitReturn.errorMessage);
      }

      Telemetry.sendEvent({
        name: commitGitReturn.success
          ? `install-agent:commit_config:commit_success`
          : `install-agent:commit_config:commit_failure`,
        properties: {
          filesDiffText,
        },
      });

      return commitGitReturn.success;
    } else {
      Telemetry.sendEvent({
        name: `install-agent:commit_config:commit_no`,
        properties: {
          filesDiffText,
        },
      });
    }

    return false;
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
