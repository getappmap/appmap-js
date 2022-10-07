import yargs from 'yargs';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { verbose } from '../../utils';
import SequenceDiagramGenerator from './generator';
import printSequenceDiagram from './printMermaid';
import printText from './printText';

export const command = 'sequence-diagram [code-object...]';
export const describe =
  'Generate sequence diagrams for a specified list of code objects';

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
    default: '.',
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

  const diagramSpec = new SequenceDiagramGenerator(
    process.argv,
    appmapDir,
    codeObjectIds
  );
  await diagramSpec.initialize();
  const graphs = await diagramSpec.generate();

  for (const graph of graphs) {
    await printSequenceDiagram(
      argv.outputDir,
      graph,
      process.argv,
      diagramSpec.matchingCodeObjectOfEvent.bind(diagramSpec),
      diagramSpec.priority.priorityOf.bind(diagramSpec.priority)
    );
    await printText(
      argv.outputDir,
      graph,
      process.argv,
      diagramSpec.matchingCodeObjectOfEvent.bind(diagramSpec),
      diagramSpec.priority.priorityOf.bind(diagramSpec.priority)
    );
  }

  console.log(`Printed ${graphs.length} diagrams`);
};
