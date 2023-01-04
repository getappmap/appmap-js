import { Diagram, buildDiagram, Specification } from '@appland/sequence-diagram';
import { buildAppMap } from '@appland/models';

export function buildSequenceDiagramFromAppMapFile(fileName: string, appMapData: any): Diagram {
  const appmap = buildAppMap(appMapData).build();
  return buildDiagram(fileName, appmap, Specification.build(appmap, {}));
}
