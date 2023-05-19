import { buildAppMap } from '@appland/models';
import { queue } from 'async';
import { readFile } from 'fs/promises';
import analyzeAppMaps from './analyzeAppMaps';
import buildDiagram from '@appland/sequence-diagram/dist/buildDiagram';
import { Diagram } from '@appland/sequence-diagram/dist/types';

export default async function buildDiagrams(
  appmapDir: string,
  codeObjectPatterns: string[]
): Promise<{ appmapFile: string; diagram: Diagram }[]> {
  const { appmaps, specification } = await analyzeAppMaps(appmapDir, codeObjectPatterns);
  const diagrams: { appmapFile: string; diagram: Diagram }[] = [];

  const diagramQueue = queue(async (appmapFile: string) => {
    const appmapData = JSON.parse(await readFile([appmapFile, 'appmap.json'].join('.'), 'utf-8'));
    const appmap = buildAppMap().source(appmapData).build();
    diagrams.push({
      appmapFile,
      diagram: buildDiagram([appmapFile, 'appmap.json'].join('.'), appmap, specification),
    });
  }, 2);
  for (const appmap of appmaps) diagramQueue.push(appmap);
  diagramQueue.error((err) => console.warn(err));
  if (!diagramQueue.idle()) await diagramQueue.drain();

  return diagrams;
}
