import { readFile } from 'fs/promises';
import { warn } from 'console';
import { isAbsolute, join } from 'path';
import { ContextV2 } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';
import Location from './location';
import { exists, isFile } from '../../utils';

export default class LocationContextCollector {
  constructor(private sourceDirectories: string[], private locations: Location[]) {}

  async collectContext(): Promise<{
    searchResponse: SearchRpc.SearchResponse;
    context: ContextV2.ContextResponse;
  }> {
    const result: { searchResponse: SearchRpc.SearchResponse; context: ContextV2.ContextResponse } =
      { searchResponse: { results: [], numResults: 0 }, context: [] };

    const candidateLocations = new Array<{ location: Location; directory?: string }>();
    for (const location of this.locations) {
      const { path } = location;
      if (isAbsolute(path)) {
        const directory = this.sourceDirectories.find((dir) => path.startsWith(dir));
        candidateLocations.push({ location, directory });
      } else {
        for (const sourceDirectory of this.sourceDirectories) {
          candidateLocations.push({ location, directory: sourceDirectory });
        }
      }
    }

    for (const { location, directory } of candidateLocations) {
      const pathTokens = [directory, location.path].filter(Boolean) as string[];
      const path = join(...pathTokens);
      if (!(await exists(path))) {
        continue;
      }
      if (!(await isFile(path))) {
        warn(`[location-context] Skipping non-file location: ${path}`);
        continue;
      }

      let contents: string | undefined;
      try {
        contents = await readFile(path, 'utf8');
      } catch (e) {
        warn(`[location-context] Failed to read file: ${path}`);
        continue;
      }

      const snippet = location.snippet(contents);
      result.context.push({
        type: ContextV2.ContextItemType.CodeSnippet,
        content: snippet,
        location: location.toString(),
        directory,
      });
    }

    return result;
  }
}
