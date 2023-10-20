import { isAbsolute } from 'path';
import { exists } from '../utils';
import { glob } from 'glob';
import { promisify } from 'util';

/**
 * Resolve a path to an actual file that exists within the working directory.
 * If the languageName is Java, the directory tree will be searched for the path. This is
 * because Java files are organized into a directory structure that matches the package
 * names, but the root of that directory structure is not known.
 * If there are multiple matching files, the shortest path is returned.
 */
export async function resolvePath(
  path: string,
  languageName?: string
): Promise<string | undefined> {
  // Normalize absolute path to relative path, if the path is within the source tree.
  if (path.startsWith(process.cwd())) path = path.slice(process.cwd().length + 1);

  // Discard paths that are outside the source tree.
  if (isAbsolute(path)) return;

  // Return the path if it exists.
  if (await exists(path)) return path;

  // Search for the path if the language is Java.
  if (!languageName) return;

  if (languageName.toLowerCase() === 'java') {
    const matches = (await promisify(glob)(`**/${path}`)).sort((a, b) => a.length - b.length);
    if (matches.length === 0) return;

    return matches[0];
  }
}
