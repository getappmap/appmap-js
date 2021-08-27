/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import { promises as fsp } from 'fs';
import AgentInstaller from './agentInstallerBase';
import BuildToolInstaller from './buildToolInstallerBase';
import CommandStruct from './commandStruct';
import ValidationError from './validationError';

const REGEX_GEM_DECLARATION = /(?!\s)(?:gem|group|require)\s/m;
const REGEX_GEM_DEPENDENCY = /^\s*gem\s+['|"]appmap['|"].*$/m;
const GEM_DEPENDENCY = "gem 'appmap', :groups => [:development, :test]";

export class BundleInstaller extends BuildToolInstaller {
  constructor(protected readonly path: string) {
    super('Gemfile', path);
  }

  get assumptions(): string {
    return `Your project contains a Gemfile. Therefore, it looks like a Bundler project,
so we will install the AppMap Ruby gem, "appmap". This gem will be installed as close to the beginning
of your Gemfile as possible, so that AppMap can observe and hook the other gems as they load.`;
  }

  get postInstallMessage(): string {
    return `The AppMap Ruby gem ("appmap") has been added to your Gemfile. You should open this file and check that
it looks clean and correct.

Once you've done that, we'll complete the installation of the AppMap gem by running the following command
in your terminal:`;
  }

  get verifyCommand(): CommandStruct {
    return new CommandStruct('bundle', ['install'], this.path);
  }

  async install(): Promise<void> {
    let gemfile = (await fsp.readFile(super.buildFilePath)).toString();
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

      await fsp.writeFile(super.buildFilePath, gemfile);
    } else {
      await fsp.writeFile(
        super.buildFilePath,
        `${gemfile}\ngem "appmap", :groups => [:development, :test]\n`
      );
    }
  }

  get agentInitCommand(): CommandStruct {
    return new CommandStruct(
      'bundle',
      ['exec', 'appmap-agent-init'],
      this.path
    );
  }
}

export default class RubyAgentInstaller extends AgentInstaller {
  constructor(path: string) {
    const installers = [new BundleInstaller(path)].filter(
      (installer) => installer.available
    );
    if (installers.length === 0) {
      throw new ValidationError(
        'No Ruby installer available for the current project. Supported frameworks are: Bundler.'
      );
    }

    super(installers[0], path);
  }
}
