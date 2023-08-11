import { buildAppMap } from '@appland/models';
import {
  buildDiagram,
  format,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { readFile, stat, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { ProcessFileOptions, processFiles } from '../../utils';
import FileTooLargeError from '../../fingerprint/fileTooLargeError';
import { CountNumProcessed } from './CountNumProcessed';
import reportAppMapProcessingError from './reportAppMapProcessingError';
import buildFilter, { Language } from './buildFilter';
import { CompareFilter } from '../../lib/loadAppMapConfig';

export default async function updateSequenceDiagrams(
  dir: string,
  maxAppMapSizeInBytes: number,
  compareFilter: CompareFilter
): Promise<{ numGenerated: number; oversizedAppMaps: string[] }> {
  const specOptions = {
    loops: true,
  } as SequenceDiagramOptions;

  const oversizedAppMaps = new Array<string>();

  const generateDiagram = async (appmapFileName: string) => {
    // Determine size of file appmapFileName in bytes
    const stats = await stat(appmapFileName);
    if (stats.size > maxAppMapSizeInBytes) {
      oversizedAppMaps.push(appmapFileName);
      throw new FileTooLargeError(appmapFileName, stats.size, maxAppMapSizeInBytes);
    }

    const fullAppMap = buildAppMap()
      .source(await readFile(appmapFileName, 'utf8'))
      .build();

    const language = fullAppMap.metadata?.language?.name || 'unknown';
    const filter = buildFilter(language as Language, compareFilter);
    const filteredAppMap = filter.filter(fullAppMap, []);
    const specification = Specification.build(filteredAppMap, specOptions);
    const diagram = buildDiagram(appmapFileName, filteredAppMap, specification);
    const diagramOutput = format(FormatType.JSON, diagram, appmapFileName);
    const indexDir = join(dirname(appmapFileName), basename(appmapFileName, '.appmap.json'));
    const diagramFileName = join(indexDir, 'sequence.json');
    await writeFile(diagramFileName, diagramOutput.diagram);
  };

  const counter = new CountNumProcessed();
  const options = new ProcessFileOptions();
  options.fileCountFn = counter.setCount();
  options.errorFn = reportAppMapProcessingError('Sequence diagram');
  await processFiles(dir, '.appmap.json', generateDiagram, options);

  return { numGenerated: counter.count, oversizedAppMaps };
}
