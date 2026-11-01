import yargs from 'yargs';
import Context from '../../inspect/context';
import UI from '../../inspect/ui';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { verbose } from '../../utils';

export default async function handler(argv) {
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
      return yargs.exit(1, new Error(`Code object '${context.codeObjectId}' not found`));
    }
    await context.buildStats();
    console.log(JSON.stringify(context.stats, null, 2));
  }
}
