import { AppMapFilter, serializeFilter } from '@appland/models';
import { SearchRpc } from '@appland/rpc';
import assert from 'assert';

import { handler as sequenceDiagramHandler } from '../appmap/sequenceDiagram';
import { ContextV2 } from '@appland/navie';
import appmapLocation from './appmap-location';

export default async function buildSequenceDiagram(
  result: SearchRpc.SearchResult
): Promise<ContextV2.FileContextItem> {
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
  return {
    directory: result.directory,
    location: appmapLocation(result.appmap),
    type: ContextV2.ContextItemType.SequenceDiagram,
    content: plantUML,
    score: result.score,
  };
}
