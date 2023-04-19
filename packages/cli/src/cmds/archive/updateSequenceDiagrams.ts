import { AppMapFilter, buildAppMap } from '@appland/models';
import {
  buildDiagram,
  format,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { readFile, stat, unlink, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { promisify } from 'util';

export default async function updateSequenceDiagrams(
  dir: string,
  maxAppMapSizeInBytes: number,
  filter: AppMapFilter
): Promise<{ oversizedAppMaps: string[] }> {
  const specOptions = {
    loops: true,
  } as SequenceDiagramOptions;

  const oversizedAppMaps = new Array<string>();
  const sequenceDiagramQueue = queue(async (appmapFileName: string) => {
    // Determine size of file appmapFileName in bytes
    const stats = await stat(appmapFileName);
    if (stats.size > maxAppMapSizeInBytes) {
      console.log(
        `Skipping, and removing, ${appmapFileName} because its size of ${stats.size} exceeds the maximum size of ${maxAppMapSizeInBytes} MB`
      );
      oversizedAppMaps.push(appmapFileName);
      await unlink(appmapFileName);
      return;
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
  }, Concurrency);
  sequenceDiagramQueue.error(console.warn);

  (await promisify(glob)(join(dir, '**', '*.appmap.json'))).forEach((appmapFileName) =>
    sequenceDiagramQueue.push(appmapFileName)
  );
  if (sequenceDiagramQueue.length()) await sequenceDiagramQueue.drain();

  return { oversizedAppMaps };
}
