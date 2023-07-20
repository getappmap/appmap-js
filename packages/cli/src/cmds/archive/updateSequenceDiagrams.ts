import Piscina from 'piscina';
import { promisify } from 'util';
import glob from 'glob';
import { cpus } from 'os';
import { stat } from 'fs/promises';
import { join, resolve } from 'path';
import { AppMapFilter, serializeFilter } from '@appland/models';
import { SequenceDiagramOptions } from '@appland/sequence-diagram';
import reportAppMapProcessingError from './reportAppMapProcessingError';

export default async function updateSequenceDiagrams(
  dir: string,
  maxAppMapSizeInBytes: number,
  filter: AppMapFilter
): Promise<{ numGenerated: number; oversizedAppMaps: string[] }> {
  const specOptions = {
    loops: true,
  } as SequenceDiagramOptions;

  const oversizedAppMaps = new Array<string>();

  const cores = Math.round(cpus().length / 4);
  console.log(`Using ${cores}..${cores * 2} cores to generate sequence diagrams`);
  const piscina = new Piscina({
    filename: resolve(__dirname, 'workers/buildSequenceDiagram.js'),
    minThreads: cores,
    maxThreads: cores * 2,
  });
  piscina.on('error', reportAppMapProcessingError('Sequence diagram'));

  const files = await promisify(glob)(join(dir, '**', '*.appmap.json'));
  const filesToProcess = new Array<string>();
  for (const file of files) {
    const stats = await stat(file);
    if (stats.size > maxAppMapSizeInBytes) {
      oversizedAppMaps.push(file);
      continue;
    }

    filesToProcess.push(file);
  }

  const filterStr = serializeFilter(filter);
  const startTime = new Date().getTime();
  await Promise.all(
    filesToProcess.map((file) => piscina.run({ appmapFileName: file, filterStr, specOptions }))
  );
  const elapsed = new Date().getTime() - startTime;
  const sequenceDiagrams = await promisify(glob)(join(dir, '**', 'sequence.json'));
  console.log(`Generated ${sequenceDiagrams.length} sequence digrams in ${elapsed}ms`);
  if (sequenceDiagrams.length !== filesToProcess.length) {
    console.warn(
      `Expected ${filesToProcess.length} sequence diagrams, but found ${sequenceDiagrams.length}`
    );
  }

  return { numGenerated: files.length, oversizedAppMaps };
}
