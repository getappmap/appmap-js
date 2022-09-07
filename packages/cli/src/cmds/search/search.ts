import yargs, { number } from 'yargs';
import readline from 'readline';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import FindCodeObjects from '../../search/findCodeObjects';
import FindEvents from '../../search/findEvents';
import { verbose } from '../../utils';
import FindStack, { FindStackMatch } from '../../search/findStack';

export const command = 'search';
export const describe =
  'Search AppMaps for references to a code objects (package, function, line, class, query, route, etc)';

export const builder = (args) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });
  args.option('route', {
    describe: 'a route which all matches must contain',
  });
  args.option('limit', {
    describe: 'number of top matches to print',
    type: number,
    default: 20,
  });
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);
  const route = argv.route;
  const limit = argv.limit;

  if (!route) yargs.exit(1, new Error(`No route was provided`));

  const routeParam = `route:${route}`;
  let stack: string;

  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    stack = await new Promise((resolve) => {
      rl.question(`Enter a stack trace to search for: `, resolve);
    });
  } else {
    const result: Buffer[] = [];
    let length = 0;
    for await (const chunk of process.stdin) {
      result.push(chunk);
      length += chunk.length;
    }
    stack = Buffer.concat(result, length).toString('utf8');
  }

  if (!stack) yargs.exit(1, new Error(`No stack was provided`));
  const stackLines = stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  const finder = new FindCodeObjects(appmapDir, routeParam);
  const codeObjectMatches = await finder.find(
    (count) => {},
    () => {}
  );

  if (codeObjectMatches?.length === 0) {
    return yargs.exit(1, new Error(`Code object '${routeParam}' not found`));
  }

  const result: FindStackMatch[] = [];
  await Promise.all(
    codeObjectMatches.map(async (codeObjectMatch) => {
      const findStack = new FindStack(codeObjectMatch.appmap, stackLines);
      const matches = await findStack.match();
      result.push(...matches);
    })
  );

  result
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .forEach((match) => {
      console.log(
        `Event: ${match.appmap}.appmap.json:${match.eventId}, Code Object: ${match.codeObjectId}, score: ${match.score}`
      );
      console.log('\n');
    });
};
