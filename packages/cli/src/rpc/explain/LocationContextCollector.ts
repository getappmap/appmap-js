import { readFile } from 'fs/promises';
import { warn } from 'console';
import { isAbsolute, join } from 'path';
import { ContextV2 } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';
import Location from './location';
import { exists, isFile, verbose } from '../../utils';

/**
 * LocationContextCollector is responsible for collecting context information from specified locations
 * within source directories. It reads the contents of files at these locations and extracts code snippets
 * to build a context response.
 *
 * Primary effects:
 * - Iterates over provided locations and determines if they are absolute or relative paths.
 * - For each location, constructs the full path and checks if the file exists and is a valid file.
 * - Reads the contents of the file and extracts a code snippet based on the location.
 * - Builds a context response containing the extracted code snippets and their respective locations.
 * - Returns the context response along with a search response.
 */
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

    if (verbose())
      warn(
        `[location-context] Candidate locations: ${candidateLocations
          .map((loc) => loc.location.toString())
          .join(', ')}`
      );

    for (const { location, directory } of candidateLocations) {
      let pathTokens: string[] = [];

      if (isAbsolute(location.path)) pathTokens = [location.path];
      else if (directory) pathTokens = [directory, location.path].filter(Boolean);

      const path = join(...pathTokens);
      if (!(await exists(path))) {
        if (verbose()) warn(`[location-context] Skipping non-existent location: ${path}`);
        continue;
      }
      if (!(await isFile(path))) {
        if (verbose()) warn(`[location-context] Skipping non-file location: ${path}`);
        continue;
      }

      let contents: string | undefined;
      try {
        contents = await readFile(path, 'utf8');
      } catch (e) {
        warn(`[location-context] Failed to read file: ${path}`);
        continue;
      }

      if (verbose())
        warn(
          `[location-context] Extracting snippet for location: ${location.toString()} (${
            contents.length
          } bytes)`
        );

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
