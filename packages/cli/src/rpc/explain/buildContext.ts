import { SearchRpc } from '@appland/rpc';
import { warn } from 'console';
import { ContextV2 } from '@appland/navie';

import lookupSourceCode from './lookupSourceCode';
import buildSequenceDiagram from './build-sequence-diagram';
import appmapLocation from './appmap-location';

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
export default async function buildContext(
  searchResults: SearchRpc.SearchResult[]
): Promise<ContextV2.ContextResponse> {
  const sequenceDiagrams = new Array<ContextV2.FileContextItem>();
  const codeSnippets = new Array<ContextV2.FileContextItem>();
  const dataRequests = new Array<ContextV2.FileContextItem>();

  const codeSnippetLocations = new Set<string>();
  const dataRequestContent = new Set<string>();

  const examinedLocations = new Set<string>();
  for (const result of searchResults) {
    try {
      sequenceDiagrams.push(await buildSequenceDiagram(result));
    } catch (e) {
      warn(`Failed to build sequence diagram for ${result.appmap}`);
      warn(e);
    }
    for (const event of result.events) {
      if (!event.location) {
        if (!dataRequestContent.has(event.fqid)) {
          dataRequestContent.add(event.fqid);
          dataRequests.push({
            directory: result.directory,
            location: appmapLocation(result.appmap, event),
            type: ContextV2.ContextItemType.DataRequest,
            content: event.fqid,
            score: event.score,
          });
        }
        continue;
      }

      if (examinedLocations.has(event.location)) continue;

      examinedLocations.add(event.location);

      if (codeSnippetLocations.has(event.location)) continue;

      codeSnippetLocations.add(event.location);

      // TODO: Snippets from appmap events will no longer be needed, because the snippets come
      // from the search results in the index (boosted by AppMap references).
      const snippets = await lookupSourceCode(result.directory, event.location);
      if (snippets) {
        codeSnippets.push({
          directory: result.directory,
          type: ContextV2.ContextItemType.CodeSnippet,
          location: event.location,
          content: snippets.join('\n'),
          score: event.score,
        });
      }
    }
  }

  return [...sequenceDiagrams, ...codeSnippets, ...dataRequests];
}
