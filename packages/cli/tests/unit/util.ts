import { utimesSync } from 'fs';
import Fingerprinter from '../../src/fingerprint/fingerprinter';
import { IndexCodeObject, CodeObjectMatch } from '../../src/search/types';
import { listAppMapFiles, verbose } from '../../src/utils';

if (process.env.DEBUG) {
  verbose(true);
}

export function stripCodeObjectParents(codeObjectMatches: CodeObjectMatch[]): CodeObjectMatch[] {
  const strip = (codeObject: IndexCodeObject): void => {
    codeObject.parent = undefined;
    codeObject.children = undefined;
    (codeObject.children || []).forEach(strip);
  };
  codeObjectMatches.forEach((com) => strip(com.codeObject));
  return codeObjectMatches;
}

export async function indexDirectory(dir: string): Promise<void> {
  const now = new Date();
  const fingerprinter = new Fingerprinter(true);
  await listAppMapFiles(dir, async (fileName) => {
    utimesSync(fileName, now, now);
    await fingerprinter.fingerprint(fileName);
  });
}
