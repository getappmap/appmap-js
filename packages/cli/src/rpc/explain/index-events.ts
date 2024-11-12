import { SnippetId, SnippetIndex } from '@appland/search';
import { warn } from 'console';
import crypto from 'crypto';

import { SearchResult } from '../../fulltext/appmap-match';
import { ClassMapEntry, readIndexFile } from '../../fulltext/appmap-index';

function hexDigest(input: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}

async function indexAppMapEvents(
  snippetIndex: SnippetIndex,
  directory: string,
  appmapFile: string
): Promise<void> {
  const appmapName = appmapFile.endsWith('.appmap.json')
    ? appmapFile.slice(0, -'.appmap.json'.length)
    : appmapFile;
  const classMap = await readIndexFile<ClassMapEntry[]>(appmapName, 'classMap');
  if (!classMap) {
    warn(`[index-events] No class map found for ${appmapName}`);
    return;
  }

  const indexCodeObject = (type: string, id: string, content: string, ...tags: string[]) => {
    const words = [content, ...tags].join(' ');

    const snippetId: SnippetId = {
      type,
      id,
    };

    // TODO: Include event id in the snippet id
    snippetIndex.indexSnippet(snippetId, directory, '', words, content);
  };

  const boostCodeObject = (location: string) => {
    const snippetId: SnippetId = {
      type: 'code-snippet',
      id: location,
    };
    snippetIndex.boostSnippet(snippetId, 2);
  };

  const indexClassMapEntry = (cme: ClassMapEntry) => {
    let id: string | undefined;
    let tags: string[] = [];
    if (cme.type === 'query') {
      id = hexDigest(cme.name);
      tags = ['sql', 'query', 'database'];
    } else if (cme.type === 'route') {
      id = cme.name;
      tags = ['route', 'request', 'server', 'http'];
    } else if (cme.type === 'external-route') {
      id = cme.name;
      tags = ['route', 'request', 'client', 'http'];
    }

    if (id) indexCodeObject(cme.type, id, cme.name, ...tags);

    if (cme.sourceLocation) boostCodeObject(cme.sourceLocation);

    cme.children?.forEach((child) => {
      indexClassMapEntry(child);
    });
  };
  classMap.forEach((co) => indexClassMapEntry(co));
}

export default async function indexEvents(
  snippetIndex: SnippetIndex,
  appmapSearchResults: SearchResult[]
): Promise<void> {
  for (const { directory, appmap } of appmapSearchResults) {
    await indexAppMapEvents(snippetIndex, directory, appmap);
  }
}
