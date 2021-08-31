/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import chalk from 'chalk';
import { promises as fsp } from 'fs';
import { join } from 'path';
import { exists } from '../../utils';
import AgentInstaller from './agentInstaller';
import CommandStruct from './commandStruct';

const REGEX_GEM_DECLARATION = /(?!\s)(?:gem|group|require)\s/m;
const REGEX_GEM_DEPENDENCY = /^\s*gem\s+['|"]appmap['|"].*$/m;
const GEM_DEPENDENCY = "gem 'appmap', :groups => [:development, :test]";

export class BundleInstaller implements AgentInstaller {
  constructor(readonly path: string) {}

  get name(): string {
    return 'Bundler';
  }

  get buildFile(): string {
    return 'Gemfile';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  postInstallMessage(): string {
    return [
      `Run your tests with ${chalk.blue('APPMAP=true')} in the environment.`,
      `AppMap files will be output to ${chalk.blue('tmp/appmap')}.`,
    ].join('\n');
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  verifyCommand(): CommandStruct {
    return new CommandStruct('bundle', ['install'], this.path);
  }

  async installAgent(): Promise<void> {
    let gemfile = (await fsp.readFile(this.buildFilePath)).toString();
    const index = gemfile.search(REGEX_GEM_DECLARATION);

    if (index !== -1) {
      const gemExists = gemfile.search(REGEX_GEM_DEPENDENCY) !== -1;

      if (gemExists) {
        // Replace the existing gem declaration entirely
        gemfile = gemfile.replace(REGEX_GEM_DEPENDENCY, `\n${GEM_DEPENDENCY}`);
      } else {
        // Insert a new gem declaration
        const chars = gemfile.split('');
        chars.splice(index, 0, `${GEM_DEPENDENCY}\n\n`);
        gemfile = chars.join('');
      }

      await fsp.writeFile(this.buildFilePath, gemfile);
    } else {
      await fsp.writeFile(
        this.buildFilePath,
        `${gemfile}\ngem "appmap", :groups => [:development, :test]\n`
      );
    }
  }

  initCommand(): CommandStruct {
    return new CommandStruct(
      'bundle',
      ['exec', 'appmap-agent-init'],
      this.path
    );
  }
}

const RubyAgentInstaller = {
  name: 'Ruby',
  documentation: 'https://appland.com/docs/reference/appmap-ruby',
  installers: [BundleInstaller],
};

export default RubyAgentInstaller;
