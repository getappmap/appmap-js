import { SearchRpc } from '@appland/rpc';
import { AppMapFilter, serializeFilter } from '@appland/models';
import assert from 'assert';

import { handler as sequenceDiagramHandler } from '../appmap/sequenceDiagram';
import lookupSourceCode from './lookupSourceCode';
import { warn } from 'console';

/**
 * Processes search results to build sequence diagrams, code snippets, and code object sets. This is the format
 * expected by the Navie AI.
 *
 * Given a list of search results, `buildContext` asynchronously:
 *
 * - Generates sequence diagrams for each result using event data and a filtered appmap,
 *   formatting the output as PlantUML and storing it in an array. The filtered sequence diagram
 *   includes only the code objects associated with the events in the search result, and their near neighbors.
 *
 * - Collects and de-duplicates code snippets tied to specific events' locations, storing them in a map with the location as the key.
 *
 * - Gathers a set of unique code objects identified by their fully qualified identifiers (fqid) from the events.
 *   These code objects are most commonly SQL queries and HTTP requests (client and server), since code snipptes are stored separately.
 *   The term "data requests" is being phased in to replace "codeObjects".
 */
export default async function buildContext(searchResults: SearchRpc.SearchResult[]): Promise<{
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
  for (const result of searchResults) {
    try {
      await buildSequenceDiagram(result);
    } catch (e) {
      warn(`Failed to build sequence diagram for ${result.appmap}`)
      warn(e);
      continue;
    }
    for (const event of result.events) {
      if (!event.location) {
        codeObjects.add(event.fqid);
        continue;
      }

      if (examinedLocations.has(event.location)) continue;
      examinedLocations.add(event.location);

      if (codeSnippets.has(event.location)) continue;

      const snippets = await lookupSourceCode(result.directory, event.location);
      if (snippets) {
        codeSnippets.set(event.location, snippets.join('\n'));
      }
    }
  }

  return { sequenceDiagrams, codeSnippets, codeObjects };
}
