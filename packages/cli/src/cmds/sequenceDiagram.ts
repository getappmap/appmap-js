import { mkdir, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import yargs from 'yargs';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../lib/locateAppMapDir';
import buildDiagrams from '../sequenceDiagram/buildDiagrams';
import { verbose } from '../utils';

export const command = 'sequence-diagram [code-object...]';
export const describe = 'Generate sequence diagrams for a specified list of code objects';

export const builder = (args: yargs.Argv) => {
  args.positional('code-object', {
    describe:
      'identifies a code-object to display (at least two must be provided by repeating this positional argument)',
    array: true,
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });
  args.option('output-dir', {
    describe: 'directory in which to save the sequence diagrams',
  });
  args.option('format', {
    describe: 'output format',
    choices: ['mermaid', 'plantuml', 'json'],
    default: 'mermaid',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);

  let codeObjectIds = argv.codeObject as string[];
  if (!codeObjectIds || codeObjectIds.length < 1) {
    console.log(`At least one code object id argument is required`);
    process.exitCode = 1;
    return;
  }

  const formatter = require(`@appland/sequence-diagram/dist/formatter/${argv.format}`);

  const diagrams = (await buildDiagrams(appmapDir, codeObjectIds)).filter(
    (d) => d.diagram.actors.length > 0
  );

  if (argv.outputDir) await mkdir(argv.outputDir, { recursive: true });

  for (const diagram of diagrams) {
    const template = formatter.format(diagram.diagram, diagram.appmapFile);

    const outputFileName = [
      basename(diagram.appmapFile).split('.')[0],
      '.sequence',
      formatter.extension,
    ].join('');

    let outputPath: string;
    if (argv.outputDir) outputPath = join(argv.outputDir, outputFileName);
    else outputPath = join(dirname(diagram.appmapFile), outputFileName);

    await writeFile(outputPath, template);
  }

  console.log(`Printed ${diagrams.length} diagrams`);
};
