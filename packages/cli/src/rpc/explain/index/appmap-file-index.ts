import sqlite3 from 'better-sqlite3';

import { FileIndex, SessionId } from '@appland/search';

import buildIndexInTempDir, { CloseableIndex } from './build-index-in-temp-dir';
import { buildAppMapIndex, search } from './appmap-index';
import { SearchResponse } from './appmap-match';

export async function buildAppMapFileIndex(
  appmapDirectories: string[]
): Promise<CloseableIndex<FileIndex>> {
  return await buildIndexInTempDir<FileIndex>('appmaps', async (indexFile) => {
    const db = new sqlite3(indexFile);
    const fileIndex = new FileIndex(db);
    await buildAppMapIndex(fileIndex, appmapDirectories);
    return fileIndex;
  });
}

export async function searchAppMapFiles(
  sessionId: SessionId,
  appmapDirectories: string[],
  vectorTerms: string[],
  maxDiagrams: number
): Promise<SearchResponse> {
  const index = await buildAppMapFileIndex(appmapDirectories);
  try {
    return await search(index.index, sessionId, vectorTerms.join(' OR '), maxDiagrams);
  } finally {
    index.close();
  }
}
