import fs from 'fs';
import JSONStream from 'JSONStream';
import { basename } from 'path';
import Yargs from 'yargs';
import { AppMap, pruneAppMap } from './pruneAppMap';

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
  command: 'prune <file> <size>',

  describe: 'Prune an appmap file down to the given size',

  builder: (argv: Yargs.Argv) => {
    argv.option('output-dir', {
      describe: 'Specifies the output directory. Pruned files will be written here.',
      type: 'string',
      default: '.',
      alias: 'o',
    });
    argv.positional('file', {
      describe: 'AppMap to prune',
    });
    argv.positional('size', {
      describe: 'Prune input file to this size',
    });
  },

  handler: async (argv: any): Promise<void> => {
    const size = parseSize(argv.size);
    const appMap = pruneAppMap(await fromFile(argv.file), size);

    const outputPath = `${argv.outputDir}/${basename(argv.file)}`;
    fs.writeFileSync(outputPath, JSON.stringify(appMap));
    console.log('done');
  },
};
