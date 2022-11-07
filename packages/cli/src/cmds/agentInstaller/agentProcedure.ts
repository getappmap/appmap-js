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
import { fileWithInstaller } from './types/state';

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

  async filesHaveDiffs(files: string[]): Promise<string[]> {
    let filesThatMatched: string[] = [];

    for (const file of files) {
      let gitDiff;
      let thereWasADiff: boolean = false;
      try {
        const stdout = runSync(new CommandStruct('git', ['diff', file], this.installer.path));
        if (stdout.length > 0) {
          gitDiff = stdout.split('\n')[0];
          thereWasADiff = true;
        } else {
          gitDiff = '[no diff]';
        }
      } catch (e) {
        const gitError = (e as Error).message.split('\n')[1];
        gitDiff = `[git diff failed, ${gitError}]`;
      }

      if (thereWasADiff) {
        filesThatMatched.push(file);
      }
    }

    return filesThatMatched;
  }

  async filesArePartOfProject(files: string[]): Promise<string[]> {
    let filesThatMatched: string[] = [];

    for (const file of files) {
      let gitStatus;
      let isPartOfProject: boolean = false;
      try {
        const stdout = runSync(
          new CommandStruct('git', ['status', '-s', file], this.installer.path)
        );
        if (stdout.length > 0) {
          gitStatus = stdout.split('\n')[0];
          if (gitStatus[0] !== '?') isPartOfProject = true;
        } else {
          gitStatus = '[no status]';
        }
      } catch (e) {
        const gitError = (e as Error).message.split('\n')[1];
        gitStatus = `[git status failed, ${gitError}]`;
      }

      if (isPartOfProject) {
        filesThatMatched.push(file);
      }
    }

    return filesThatMatched;
  }

  async gitCommit(files: string[], commitMessage: string): Promise<boolean> {
    let gitCommit;
    let isPartOfProject: boolean = false;
    let itWorked: boolean = false;
    try {
      let params: string[] = ['commit', '-m', commitMessage];
      for (const file of files) {
        params.push(file);
      }
      const stdout = runSync(new CommandStruct('git', params, this.installer.path));
      itWorked = true;
    } catch (e) {
      const gitError = (e as Error).message.split('\n')[1];
      gitCommit = `[git commit failed, ${gitError}]`;
    }

    return itWorked;
  }

  async commitConfiguration() {
    Telemetry.sendEvent({
      name: `install-agent:commit_config:commit_start`,
      properties: {},
    });

    const appmapFile: string = 'appmap.yml';
    const buildFile: string = this.installer.buildFile;
    let filesWithInstaller: fileWithInstaller[] = [
      {
        name: 'AppMap',
        file: appmapFile,
      },
      { name: 'Bundler', file: buildFile },
    ];
    // this is specific to Ruby
    if (this.installer.name === 'Bundler')
      filesWithInstaller.push({
        name: this.installer.name,
        file: 'Gemfile.lock',
      });

    let files: string[] = [];
    for (const entry of filesWithInstaller) files.push(entry.file);
    let filesArePartOfProject = await this.filesArePartOfProject(files);
    let filesArePartOfProjectText = filesArePartOfProject.flat().join('__');
    let filesHaveDiffs = await this.filesHaveDiffs(files);
    let filesHaveDiffsText = filesHaveDiffs.flat().join('__');
    let shouldCommit = false;
    // commit if any of the config files aren't part of the project or
    // if their contents changed
    if (
      (filesArePartOfProject.length > 0 && filesArePartOfProject.length != files.length) ||
      filesHaveDiffs.length > 0
    )
      shouldCommit = true;

    if (!shouldCommit) {
      Telemetry.sendEvent({
        name: `install-agent:commit_config:should_not_commit`,
        properties: {
          filesArePartOfProjectText,
          filesHaveDiffsText,
        },
      });

      return;
    }

    let filesMessages: string[] = [];
    for (const entry of filesWithInstaller) {
      filesMessages.push(`  ${chalk.blue(entry.name)}: ${entry.file}`);
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
          filesArePartOfProjectText,
          filesHaveDiffsText,
        },
      });

      let filesToCommitSet = new Set<string>();
      let filesNotPartOfProject: string[] = [];
      for (const file of files)
        if (!filesArePartOfProject.includes(file)) filesToCommitSet.add(file);
      for (const file of filesHaveDiffs) filesToCommitSet.add(file);
      const filesToCommitArray: string[] = Array.from(filesToCommitSet);

      const commitSuccess = await this.gitCommit(filesToCommitArray, 'feat: Install AppMap.');

      if (commitSuccess) {
        Telemetry.sendEvent({
          name: `install-agent:commit_config:commit_success`,
          properties: {
            filesArePartOfProjectText,
            filesHaveDiffsText,
          },
        });
      } else {
        Telemetry.sendEvent({
          name: `install-agent:commit_config:commit_failure`,
          properties: {
            filesArePartOfProjectText,
            filesHaveDiffsText,
          },
        });
      }
    } else {
      Telemetry.sendEvent({
        name: `install-agent:commit_config:commit_no`,
        properties: {
          filesArePartOfProjectText,
          filesHaveDiffsText,
        },
      });
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
