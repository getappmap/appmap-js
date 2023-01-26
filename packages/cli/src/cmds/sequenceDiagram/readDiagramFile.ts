import { readFile } from 'fs/promises';
import { Diagram, unparseDiagram } from '@appland/sequence-diagram';

export async function readDiagramFile(fileName: string): Promise<Diagram> {
  const jsonData = JSON.parse(await readFile(fileName, 'utf-8')) as any;
  return unparseDiagram(jsonData);
}
