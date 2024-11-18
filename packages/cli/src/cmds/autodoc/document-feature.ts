import yargs from 'yargs';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { warn } from 'console';

import { verbose } from '../../utils';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { readPrompt } from './read-prompt';
import documentFeature, {
  DocumentFeatureOptions,
  FeatureArtifact,
} from '../../autodoc/document-feature';
import assert from 'assert';
import { Feature } from '../../autodoc/types';

export const command = 'document-feature [feature]';
export const describe = 'Document the architecture of a feature.';

export const builder = (args: yargs.Argv) => {
  args.positional('feature', {
    describe: 'Feature to document',
    type: 'string',
    array: true,
    demandOption: true,
  });

  args.option('directory', {
    describe: 'Program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('include', {
    describe:
      'Include pattern. This pattern will be passed directly through to the Navie /include option.',
    type: 'string',
  });

  args.option('exclude', {
    describe:
      'Exclude pattern. This pattern will be passed directly through to the Navie /exclude option.',
    type: 'string',
  });

  args.option('prompt', {
    describe: 'Prompt to apply to the feature documentation.',
    type: 'string',
  });

  return args.strict();
};

type ArgumentTypes = {
  verbose: boolean;
  feature?: string[];
  directory: string;
  prompt?: string;
  include?: string;
  exclude?: string;
};

export const handler = async (argv: ArgumentTypes) => {
  verbose(argv.verbose);

  const { directory, prompt: promptStr, include, exclude, feature: featureOpt } = argv;

  if (!featureOpt) {
    yargs.exit(1, new Error('Feature argument was not provided'));
    return;
  }

  const features = Array.isArray(featureOpt) ? featureOpt : [featureOpt];

  handleWorkingDirectory(directory);

  const architectureDir = 'architecture';
  if (!existsSync(architectureDir)) mkdirSync(architectureDir, { recursive: true });

  let prompt: string | undefined;
  if (promptStr) prompt = readPrompt(promptStr);

  const saveArtifact = (
    directory: string,
    artifactName: string,
    fileName: string,
    artifact: FeatureArtifact
  ): void => {
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, fileName), artifact.content);

    const navieDir = join(directory, '.navie', artifactName);
    mkdirSync(navieDir, { recursive: true });
    writeFileSync(join(navieDir, 'question.md'), artifact.question);
    if (artifact.prompt) writeFileSync(join(navieDir, 'prompt.md'), artifact.prompt);
  };

  warn(`Documenting features: ${features.join(', ')}`);
  const featureOptions: DocumentFeatureOptions = {
    prompt,
    include,
    exclude,
  };
  for (const featureName of features) {
    const names = featureName.split('/');
    const childName = names.pop();
    assert(childName, 'Child name is required');
    const parentName = names.join('/');
    const feature: Feature = { name: childName };
    if (parentName) feature.parent = parentName;

    const doc = await documentFeature(feature, featureOptions);

    const featureDir = join([architectureDir, parentName, childName].filter(Boolean).join('/'));
    warn(`Writing documentation to ${featureDir}`);
    saveArtifact(featureDir, 'readme', 'README.md', doc.readme);
    saveArtifact(featureDir, 'class-diagram', 'class-diagram.md', doc.classDiagram);

    const navieDir = join(featureDir, '.navie');
    writeFileSync(
      join(navieDir, 'dependencyFiles.json'),
      JSON.stringify(doc.dependencyFiles, null, 2)
    );
  }
};
