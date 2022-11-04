import FindCodeObjects from '../search/findCodeObjects';
import { IndexCodeObject } from '../search/types';
import { processFiles } from '../utils';
import Specification from '@appland/sequence-diagram/dist/specification';
import Priority from '@appland/sequence-diagram/dist/priority';

type CodeObjectId = string;

export default async function analyzeAppMaps(
  appmapDir: string,
  codeObjectPatterns: string[]
): Promise<{ appmaps: string[]; specification: Specification }> {
  const requiredPatterns = new Set<string>();
  const uniquePatterns = new Set<string>();

  const priority = new Priority();
  const requiredCodeObjectIds = new Set<CodeObjectId>();
  const includedCodeObjectIds = new Set<CodeObjectId>();

  const interpretCodeObjectPattern = (pattern: string) => {
    if (pattern.charAt(0) === '+') {
      pattern = pattern.slice(1);
      requiredPatterns.add(pattern);
    }

    uniquePatterns.add(pattern);
    priority.enrollPattern(pattern);
  };

  const collectCodeObject = (
    codeObjectIds: Set<CodeObjectId>,
    codeObject: IndexCodeObject
  ): void => {
    codeObjectIds.add(codeObject.fqid);
  };

  codeObjectPatterns.forEach(interpretCodeObjectPattern);
  const appmaps = new Set<string>();

  // Match non-required patterns
  await Promise.all(
    [...uniquePatterns]
      .filter((pattern) => !requiredPatterns.has(pattern))
      .map(async (codeObjectPattern) => {
        const matches = await new FindCodeObjects(appmapDir, codeObjectPattern).find();
        const codeObjectIds = new Set<CodeObjectId>();
        matches.forEach((match) => {
          collectCodeObject(includedCodeObjectIds, match.codeObject);
          collectCodeObject(codeObjectIds, match.codeObject);
        });
        priority.expandPattern(codeObjectPattern, [...codeObjectIds]);
      })
  );

  // Collect AppMaps which match every required pattern.
  if (requiredPatterns.size > 0) {
    // Figure out which AppMaps these code objects reside in
    const appmapsForRequiredPattern = await Promise.all(
      [...requiredPatterns].map(async (codeObjectPattern) => {
        const matches = await new FindCodeObjects(appmapDir, codeObjectPattern).find();
        const codeObjectIds = new Set<CodeObjectId>();
        const appmaps = new Set<string>();
        matches.forEach((match) => {
          appmaps.add(match.appmap);
          collectCodeObject(includedCodeObjectIds, match.codeObject);
          collectCodeObject(requiredCodeObjectIds, match.codeObject);
          collectCodeObject(codeObjectIds, match.codeObject);
        });
        priority.expandPattern(codeObjectPattern, Array.from(codeObjectIds));
        return appmaps;
      })
    );

    const firstSet = appmapsForRequiredPattern.pop();
    if (firstSet) {
      for (const appmap of firstSet) {
        // every is true for empty arrays
        if (appmapsForRequiredPattern.every((appmaps) => appmaps.has(appmap))) {
          appmaps.add(appmap);
        }
      }
    }
  } else {
    await processFiles(`${appmapDir}/**/*.appmap.json`, (file: string, cb: () => void) => {
      appmaps?.add(file.slice(0, file.length - '.appmap.json'.length));
      cb();
    });
  }

  return {
    appmaps: [...appmaps].sort(),
    specification: new Specification(priority, includedCodeObjectIds, requiredCodeObjectIds),
  };
}
