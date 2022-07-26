import yargs from 'yargs';
import Context from '../../inspect/context';
import UI from '../../inspect/ui';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { verbose } from '../../utils';

export const command = 'inspect <code-object>';
export const describe =
  'Search AppMaps for references to a code object (package, function, class, query, route, etc) and print available event info';

export const builder = (args) => {
  args.positional('code-object', {
    describe: 'identifies the code-object to inspect',
  });
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });
  args.option('interactive', {
    describe: 'interact with the output via CLI',
    alias: 'i',
    boolean: true,
  });
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);
  const codeObjectId = argv.codeObject;

  if (argv.interactive) {
    new UI(appmapDir, codeObjectId).start();
  } else {
    const context = new Context(appmapDir, codeObjectId);
    await context.findCodeObjects();
    if (context.codeObjectMatches?.length === 0) {
      return yargs.exit(
        1,
        new Error(`Code object '${context.codeObjectId}' not found`)
      );
    }
    await context.buildStats();
    console.log(JSON.stringify(context.stats, null, 2));
  }
};
