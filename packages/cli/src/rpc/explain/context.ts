import { SearchRpc } from '@appland/rpc';
import { AppMapFilter, serializeFilter } from '@appland/models';
import assert from 'assert';

import { handler as sequenceDiagramHandler } from '../appmap/sequenceDiagram';
import lookupSourceCode from './lookupSourceCode';

export default async function context(
  searchResponse: SearchRpc.SearchResponse,
  numDiagramsToAnalyze: number
): Promise<{
  sequenceDiagrams: string[];
  codeSnippets: Map<string, string>;
  codeObjects: Set<string>;
}> {
  const sequenceDiagrams = new Array<string>();
  const codeSnippets = new Map<string, string>();
  const codeObjects = new Set<string>();

  const buildSequenceDiagram = async (result: SearchRpc.SearchResult) => {
    const codeObjects = result.events.map((event) => event.fqid);
    const appmapFilter = new AppMapFilter();
    appmapFilter.declutter.context.on = true;
    appmapFilter.declutter.context.names = codeObjects;
    const filterState = serializeFilter(appmapFilter);

    const plantUML = await sequenceDiagramHandler(result.appmap, {
      filter: filterState,
      format: 'plantuml',
      formatOptions: { disableMarkup: true },
    });
    assert(typeof plantUML === 'string');
    sequenceDiagrams.push(plantUML);
  };

  const examinedLocations = new Set<string>();
  for (const result of searchResponse.results.slice(0, numDiagramsToAnalyze)) {
    await buildSequenceDiagram(result);
    for (const event of result.events) {
      if (!event.location) {
        codeObjects.add(event.fqid);
        continue;
      }

      if (examinedLocations.has(event.location)) continue;
      examinedLocations.add(event.location);

      if (codeSnippets.has(event.location)) continue;

      const snippets = await lookupSourceCode(event.location);
      if (snippets) {
        codeSnippets.set(event.location, snippets.join('\n'));
      }
    }
  }

  return { sequenceDiagrams, codeSnippets, codeObjects };
}
