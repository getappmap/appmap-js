import yargs from 'yargs';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { findFiles, verbose } from '../../utils';
import { warn } from 'console';
import assert from 'assert';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { buildReport } from './buildReport';

export default async function handler(argv: any) {
  verbose(argv.verbose);

  const {
    outputFile,
    directory,
    resourceTokens,
    frequentFunctions: frequentFunctionLimit,
    largeAppmaps: largeAppMapLimit,
  } = argv;
  assert(resourceTokens);
  assert(typeof resourceTokens === 'number');
  assert(resourceTokens > 0);

  handleWorkingDirectory(directory);
  if (!outputFile) {
    warn(`No output file specified. Report JSON will be written to stdout.`);
  }

  const appmapDir = await locateAppMapDir(argv.appmapDir);

  if (!existsSync(join(appmapDir, 'appmap_archive.json'))) {
    warn(`No appmap_archive.json found in ${appmapDir}`);
    warn(`Run 'appmap archive' to index and analyze the AppMaps, then run this command again`);
    yargs.exit(1, new Error('No appmap_archive.json found'));
  }

  const appmaps = await findFiles(appmapDir, '.appmap.json');
  if (appmaps.length === 0) {
    warn(`No AppMaps found in ${appmapDir}`);
    return;
  }

  warn(`Building inventory data from ${appmaps.length} AppMaps in ${appmapDir}`);

  const report = await buildReport(appmapDir, appmaps, {
    resourceTokens:
      resourceTokens + 1 /* The url '/' is actually 2 tokens, so add 1 to the user input */,
    frequentFunctionLimit,
    largeAppMapLimit,
  });

  const reportJSONStr = JSON.stringify(report, null, 2);
  if (outputFile) {
    await writeFile(outputFile, reportJSONStr);
  } else {
    console.log(reportJSONStr);
  }
}
