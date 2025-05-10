/**
 * Examine all the diffs in a git diff output and replace long ones with a simple
 * message indicating that there is a change and its size.
 * @param patchset - The patchset to process.
 * @param maxDiffLength - The maximum length of a diff to include in the patchset.
 * @param ignoreList - A list of paths to ignore when processing the patchset.
 *                    This is useful for ignoring files that are not relevant to the
 *                    changes being made, such as dependencies or generated files.
 *                    The default ignore list includes common directories and files
 *                    that are typically not relevant to code changes.
 * @returns The processed patchset.
 */
export default function processPatchset(
  patchset: string,
  maxDiffLength = Infinity,
  ignoreList = DEFAULT_IGNORE_LIST
): string {
  const parts = patchset.split(/^(?=diff|commit)/m);
  const ignoreRegex = buildIgnoreRegex(ignoreList);
  return parts
    .filter((part) => !part.match(ignoreRegex))
    .map((part) => {
      if (part.startsWith('diff')) {
        const lines = part.split('\n');
        const header = lines[0];
        const body = lines.slice(1).join('\n');
        if (body.length > maxDiffLength) {
          return `${header}\n[Change of size ${body.trimEnd().length}]\n`;
        }
      }
      return part;
    })
    .join('');
}

function buildIgnoreRegex(ignoreList: readonly string[]): RegExp {
  if (ignoreList.length === 0) return /(?!)/; // Matches nothing
  const escapedIgnoreList = ignoreList.map((path) => path.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
  return new RegExp(`^diff --git a/(?:${escapedIgnoreList.join('|')})(/| )`, 's');
}

const DEFAULT_IGNORE_LIST: readonly string[] = [
  'node_modules',
  'vendor',
  'venv',
  'dist',
  'build',
  'target',
  'coverage',
  'tmp',
  'log',
  '.venv',
  'yarn.lock',
  'package-lock.json',
  'Gemfile.lock',
  'go.sum',
  'composer.lock',
];