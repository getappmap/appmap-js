import { buildAppMap } from '@appland/models';
import { queue } from 'async';
import { readFile } from 'fs/promises';
import analyzeAppMaps from './analyzeAppMaps';
import buildDiagram from './buildDiagram';
import { Diagram } from './types';

export default async function buildDiagrams(
  appmapDir: string,
  codeObjectPatterns: string[]
): Promise<{ appmapFile: string; diagram: Diagram }[]> {
  const specification = await analyzeAppMaps(appmapDir, codeObjectPatterns);
  const diagrams: { appmapFile: string; diagram: Diagram }[] = [];

  const diagramQueue = queue(async (appmapFile: string) => {
    const appmapData = JSON.parse(await readFile([appmapFile, 'appmap.json'].join('.'), 'utf-8'));
    const appmap = buildAppMap().source(appmapData).build();
    diagrams.push({
      appmapFile,
      diagram: buildDiagram([appmapFile, 'appmap.json'].join('.'), appmap, specification),
    });
  }, 5);
  for (const appmap of specification.appmaps) diagramQueue.push(appmap);
  diagramQueue.error((err) => console.warn(err));
  await diagramQueue.drain();

  return diagrams;
}
