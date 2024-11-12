import yargs from 'yargs';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { warn } from 'console';
import readline from 'readline';

import { verbose } from '../../utils';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { default as genListFeatures } from '../../autodoc/list-features';
import { Feature } from '../../autodoc/types';
import { readPrompt } from './read-prompt';
import { promisify } from 'util';
import { ask } from '../compare/ui';

export const command = 'list-features';
export const describe =
  'Enumerate the features of an application, based on an analysis of AppMap data and project files.';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'Program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('include', {
    describe: 'Include patterns',
    type: 'array',
  });

  args.option('exclude', {
    describe: 'Exclude patterns',
    type: 'array',
  });

  args.option('prompt', {
    describe:
      'A textual explanation of how to use the available project information to list the features of the project. May be a text string or a file name.',
    type: 'string',
  });

  args.option('create-template-dirs', {
    describe: 'Create a template directory for each new feature',
    type: 'boolean',
    alias: '-c',
    default: false,
  });

  args.option('confirm-template-dirs', {
    describe: 'Confirm the creation of each directory',
    type: 'boolean',
    default: false,
  });

  return args.strict();
};

type ArgumentTypes = {
  verbose: boolean;
  directory: string;
  prompt?: string;
  include?: string[];
  exclude?: string[];
  createTemplateDirs?: boolean;
  confirmTemplateDirs?: boolean;
};

async function listFeatures(
  knownFeatures: string[],
  includeStr?: string[],
  excludeStr?: string[],
  prompt?: string
): Promise<Feature[]> {
  let includePatterns: RegExp[] | undefined = undefined;
  if (includeStr) includePatterns = includeStr.map((pattern) => new RegExp(pattern));

  let excludePatterns: RegExp[] | undefined = undefined;
  if (excludeStr) excludePatterns = excludeStr.map((pattern) => new RegExp(pattern));

  let listFeaturesPromptText: string | undefined = undefined;
  if (prompt) listFeaturesPromptText = readPrompt(prompt);

  return await genListFeatures({
    prompt: listFeaturesPromptText,
    includePatterns,
    excludePatterns,
    knownFeatures,
  });
}

type ConfirmResponse = 'y' | 'n' | 'q';

export const handler = async (argv: ArgumentTypes) => {
  verbose(argv.verbose);

  const {
    directory,
    prompt: listFeaturesPrompt,
    include: includeStr,
    exclude: excludeStr,
    createTemplateDirs,
    confirmTemplateDirs,
  } = argv;

  handleWorkingDirectory(directory);

  const architectureDir = 'architecture';
  if (!existsSync(architectureDir)) mkdirSync(architectureDir, { recursive: true });

  const knownFeatures = new Array<string>();
  const featureIds = readdirSync(architectureDir);
  knownFeatures.push(...featureIds);

  const features = await listFeatures(knownFeatures, includeStr, excludeStr, listFeaturesPrompt);

  warn(`Detected features: ${features.map((feature) => feature.name).join(', ')}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const confirmTemplate = async (feature: Feature): Promise<ConfirmResponse> => {
    if (!confirmTemplateDirs) return true;

    const response = await ask(
      rl,
      `Create template directory for feature "${feature.name}"? (y/n/q) `
    );

    return response as ConfirmResponse;
  };

  const createTemplateDirsUI = async () => {
    for (const feature of features) {
      const { name } = feature;
      const confirmResponse = await confirmTemplate(feature);
      if (confirmResponse === 'q') break;

      if (confirmResponse === 'n') continue;

      const slugName = name.toLowerCase().replace(/[^\w]+/g, '-');
      const featureDir = join(architectureDir, slugName);
      mkdirSync(featureDir, { recursive: true });
      const dataDir = join(featureDir, 'data');
      mkdirSync(dataDir, { recursive: true });
      const dataKeepFile = join(dataDir, '.keep');
      writeFileSync(dataKeepFile, '');
      const promptDir = join(featureDir, 'prompt');
      mkdirSync(promptDir, { recursive: true });
      const promptKeepFile = join(promptDir, '.keep');
      writeFileSync(promptKeepFile, '');
    }
  };

  if (createTemplateDirs) {
    try {
      await createTemplateDirsUI();
    } finally {
      rl.close();
    }
  }
};
