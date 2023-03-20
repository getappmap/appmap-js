import fs from 'fs';
import JSONStream from 'JSONStream';
import { basename } from 'path';
import Yargs from 'yargs';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { AppMap, pruneAppMap, pruneWithFilter } from './pruneAppMap';

async function fromFile(filePath): Promise<AppMap> {
  let data: AppMap = { events: [] };

  return new Promise((resolve, reject) => {
    const jsonStream = JSONStream.parse('events.*')
      .on('header', (obj) => (data = { ...data, ...obj }))
      .on('footer', (obj) => (data = { ...data, ...obj }))
      .on('data', (e) => data.events.push(e))
      .on('close', () => resolve(data));

    fs.createReadStream(filePath).pipe(jsonStream);
  });
}

const binaryPrefixes = {
  B: 1,
  KB: 1 << 10,
  MB: 1 << 20,
  GB: 1 << 30,
};

// This isn't very robust
function parseSize(size: string) {
  const parsed = /(\d+)[\s+]?(\w+)?/.exec(size);
  if (!parsed) {
    throw new Error(`Failed parsing size ${size}`);
  }

  const [_, byteStr, unit] = parsed;
  if (!unit) {
    return Number(byteStr);
  }

  const p = binaryPrefixes[unit.toUpperCase()];
  if (!p) {
    throw new Error(`unknown size ${size}`);
  }

  return Number(byteStr) * p;
}

export default {
  command: 'prune <file>',

  describe: 'Make an appmap file smaller by removing events',

  builder: (argv: Yargs.Argv) => {
    argv.option('output-dir', {
      describe: 'Specifies the output directory',
      type: 'string',
      default: '.',
      alias: 'o',
    });

    argv.option('format', {
      describe: 'How to format the output',
      choices: ['json', 'text'],
      default: 'text',
    });

    argv.positional('file', {
      describe: 'AppMap to prune',
    });

    argv.option('size', {
      describe: 'Prune input file to this size',
      default: '15mb',
      type: 'string',
      alias: 's',
    });

    argv.option('directory', {
      describe: 'Working directory for the command',
      type: 'string',
      alias: 'd',
    });

    argv.option('filter', {
      describe: 'Filter to use to prune the map',
      type: 'string',
    });
  },

  handler: async (argv: any): Promise<void> => {
    handleWorkingDirectory(argv.directory);
    const map = await fromFile(argv.file);
    let appMap: AppMap;

    if (argv.filter) {
      appMap = pruneWithFilter(map, argv.filter);
    } else if (argv.size) {
      appMap = pruneAppMap(map, parseSize(argv.size));
    } else {
      throw Error('Invalid usage');
    }

    const outputPath = `${argv.outputDir}/${basename(argv.file)}`;
    fs.writeFileSync(outputPath, JSON.stringify(appMap));

    let message = 'done';
    if (argv.format === 'json' && !argv.fqids)
      message = JSON.stringify(
        { exclusions: Array.from(appMap.data.exclusions.values()) },
        null,
        2
      );

    console.log(message);
  },
};
