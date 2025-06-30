import { warn } from 'console';
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join } from 'node:path';

import { ContextV2 } from '@appland/navie';
import { isBinaryFile } from '@appland/search';

import { verbose } from '../../utils';
import ContentRestrictions from './ContentRestrictions';
import Location from './location';

export type LocationContextRequest = {
  sourceDirectories: string[];
  locations: Location[];
};

/**
 * Collect context information from specified locations
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
export default async function collectLocationContext(
  sourceDirectories: string[],
  locations: Location[],
  explicitFiles: string[] = []
): Promise<ContextV2.ContextResponse> {
  const result: ContextV2.ContextResponse = [];

  const candidateLocations = new Array<{ location: Location; directory: string }>();
  for (const location of locations) {
    const { path } = location;
    if (isAbsolute(path)) {
      const directory = sourceDirectories.find((dir) => path.startsWith(dir));
      if (directory) {
        location.path = location.path.slice(directory.length + 1);
        candidateLocations.push({ location, directory });
      } else if (explicitFiles.includes(path)) {
        location.path = basename(path);
        candidateLocations.push({ location, directory: dirname(path) });
      } else {
        warn(`[location-context] Skipping location outside source directories: ${location.path}`);
        continue;
      }
    } else {
      for (const sourceDirectory of sourceDirectories) {
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
    const path = join(directory, location.path);

    if (ContentRestrictions.instance.safeRestricted(directory, location.path)) {
      if (verbose()) warn(`[location-context] Skipping restricted location: ${path}`);
      result.push({
        type: ContextV2.ContextItemType.CodeSnippet,
        // TODO: tell the client out of band
        content: '[file content access denied by security policy]',
        location: location.toString(),
        directory,
      });
      continue;
    }

    const stats = await stat(path).catch(() => undefined);
    if (!stats) {
      if (verbose()) warn(`[location-context] Skipping non-existent location: ${path}`);
      // TODO: tell the client?
      continue;
    } else if (stats.isDirectory()) {
      result.push(await directoryContextItem(path, location, directory));
      continue;
    } else if (!stats.isFile()) {
      if (verbose()) warn(`[location-context] Skipping non-file location: ${path}`);
      // TODO: tell the client?
      continue;
    }

    if (await isBinaryFile(path)) {
      if (verbose()) warn(`[location-context] Skipping binary file: ${path}`);
      continue;
    }

    let contents: string | undefined;
    try {
      contents = await readFile(path, 'utf8');
    } catch (e) {
      warn(`[location-context] Failed to read file: ${path}`);
      // TODO: tell the client?
      continue;
    }

    if (verbose())
      warn(
        `[location-context] Extracting snippet for location: ${location.toString()} (${
          contents.length
        } bytes)`
      );

    const snippet = location.snippet(contents);
    result.push({
      type: ContextV2.ContextItemType.CodeSnippet,
      content: snippet,
      location: location.toString(),
      directory,
    });
  }

  return result;
}

async function directoryContextItem(
  path: string,
  location: Location,
  directory: string
): Promise<ContextV2.FileContextItem> {
  const depth = Number(location.lineRange) || 0;
  const entries: string[] = [];
  for await (const entry of listDirectory(path, depth)) entries.push(entry);
  return {
    type: ContextV2.ContextItemType.DirectoryListing,
    content: entries.join('\n'),
    location: location.toString(),
    directory,
  };
}

const MAX_SUBENTRIES = 100;

export async function* listDirectory(path: string, depth: number): AsyncGenerator<string> {
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) {
      if (depth > 0) {
        const subentries: string[] = [];
        for await (const subentry of listDirectory(entryPath, depth - 1)) subentries.push(subentry);
        if (subentries.length <= MAX_SUBENTRIES) {
          yield `${entry.name}/`;
          for (const subentry of subentries) yield `\t${subentry}`;
        } else {
          yield `${entry.name}/ (${subentries.length} entries)`;
        }
      } else yield `${entry.name}/ (${(await readdir(entryPath)).length} entries)`;
    } else if (entry.isFile()) {
      yield entry.name;
    }
  }
}
