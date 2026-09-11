import { queue } from 'async';
import { promises as fsp, readFileSync } from 'fs';
import { join } from 'path';

import Depends from '../depends';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../lib/locateAppMapDir';
import { verbose } from '../utils';

export default async function handler(argv: any) {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);

  let { files } = argv;
  if (argv.stdinFiles) {
    const stdinFileStr = readFileSync(0).toString();
    const stdinFiles = stdinFileStr.split('\n');
    files = (files || []).concat(stdinFiles);
    if (verbose()) {
      console.warn(`Computing depends on ${files.join(', ')}`);
    }
  }

  if (verbose()) {
    console.warn(`Testing AppMaps in ${appmapDir}`);
  }

  const depends = new Depends(appmapDir);
  if (argv.baseDir) {
    depends.baseDir = argv.baseDir;
  }
  if (files) {
    depends.files = files;
  }

  const appMapNames = await depends.depends();
  const values: any[] = [];
  if (argv.field) {
    const { field } = argv;
    const q = queue(async (appMapBaseName: string) => {
      const data = await fsp.readFile(join(appMapBaseName, 'metadata.json'));
      const metadata = JSON.parse(data.toString());
      const value = metadata[field];
      if (value) {
        const tokens = value.split(':');
        values.push(tokens[0]);
      } else {
        console.warn(`No ${field} in ${appMapBaseName}`);
      }
    }, 2);
    appMapNames.forEach((name) => q.push(name));
    if (!q.idle()) await q.drain();
  } else {
    appMapNames.forEach((name) => values.push(name));
  }
  console.log(Array.from(new Set(values)).sort().join('\n'));
}
