import { AppMapFilter, buildAppMap } from '@appland/models';
import {
  buildDiagram,
  format,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { queue } from 'async';
import { readFile, stat, unlink, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { basename, dirname, join } from 'path';
import { promisify } from 'util';
import { processFiles } from '../../utils';
import FileTooLargeError from '../../fingerprint/fileTooLargeError';
import { CountNumProcessed } from './CountNumProcessed';
import reportAppMapProcessingError from './reportAppMapProcessingError';

const Concurrency = 5;

export default async function updateSequenceDiagrams(
  dir: string,
  maxAppMapSizeInBytes: number,
  filter: AppMapFilter
): Promise<{ numGenerated: number; oversizedAppMaps: string[] }> {
  const specOptions = {
    loops: true,
  } as SequenceDiagramOptions;

  const oversizedAppMaps = new Array<string>();

  const generateDiagram = async (appmapFileName: string) => {
    // Determine size of file appmapFileName in bytes
    const stats = await stat(appmapFileName);
    if (stats.size > maxAppMapSizeInBytes) {
      throw new FileTooLargeError(appmapFileName, stats.size, maxAppMapSizeInBytes);
    }

    const fullAppMap = buildAppMap()
      .source(await readFile(appmapFileName, 'utf8'))
      .build();
    const filteredAppMap = filter.filter(fullAppMap, []);
    const specification = Specification.build(filteredAppMap, specOptions);
    const diagram = buildDiagram(appmapFileName, filteredAppMap, specification);
    const diagramOutput = format(FormatType.JSON, diagram, appmapFileName);
    const indexDir = join(dirname(appmapFileName), basename(appmapFileName, '.appmap.json'));
    const diagramFileName = join(indexDir, 'sequence.json');
    await writeFile(diagramFileName, diagramOutput.diagram);
  };

  const counter = new CountNumProcessed();
  await processFiles(
    join(dir, '**', '*.appmap.json'),
    generateDiagram,
    counter.setCount(),
    reportAppMapProcessingError('Sequence diagram')
  );

  return { numGenerated: counter.count, oversizedAppMaps };
}
