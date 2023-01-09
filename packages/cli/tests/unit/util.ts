import { utimesSync } from 'fs';
import Fingerprinter from '../../src/fingerprint/fingerprinter';
import { CodeObject, CodeObjectMatch } from '../../src/search/types';
import { listAppMapFiles, verbose } from '../../src/utils';

if (process.env.DEBUG) {
  verbose(true);
}

export function stripCodeObjectParents(codeObjectMatches: CodeObjectMatch[]): CodeObjectMatch[] {
  const strip = (codeObject: CodeObject): void => {
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

export async function waitFor(test: () => void | Promise<void>, timeout = 100): Promise<void> {
  const startTime = Date.now();
  let delay = 10;
  let error: Error | undefined;

  const attempt = (): boolean => {
    try {
      test();
      return true;
    } catch (err) {
      console.warn(err);
      error = err as any as Error;
      return false;
    }
  };
  while (!attempt()) {
    const elapsed = Date.now() - startTime;
    if (elapsed > timeout) {
      throw error;
    }

    console.log(`Waiting ${delay}ms`);
    await wait(delay);
    delay = delay * 2;
  }
}

async function wait(delay: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, delay));
}
