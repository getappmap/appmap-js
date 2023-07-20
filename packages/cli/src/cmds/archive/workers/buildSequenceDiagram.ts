import { readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { deserializeFilter, setSQLErrorHandler } from '@appland/models';
import { buildAppMap } from '../../../search/utils';
import {
  FormatType,
  SequenceDiagramOptions,
  Specification,
  buildDiagram,
  format,
} from '@appland/sequence-diagram';
import sqlErrorLog from '../../../lib/sqlErrorLog';

type Request = {
  appmapFileName: string;
  filter: string;
  specOptions: SequenceDiagramOptions;
};

setSQLErrorHandler(sqlErrorLog);

export default async function buildSequenceDiagram(request: Request) {
  const { appmapFileName, filter: filterStr, specOptions } = request;
  const filter = deserializeFilter(filterStr);

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
}
