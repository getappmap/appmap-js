import { readFile } from 'fs/promises';
import { Diagram as SequenceDiagram, unparseDiagram } from '@appland/sequence-diagram';

export async function loadSequenceDiagram(path: string): Promise<SequenceDiagram> {
  const diagramData = JSON.parse(await readFile(path, 'utf-8'));
  return unparseDiagram(diagramData);
}
