import { buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { join } from 'path';
import AssertionChecker from '../src/assertionChecker';
import { verbose } from '../src/scanner/util';
import { AssertionPrototype, Finding } from '../src/types';

if (process.env.VERBOSE_SCAN === 'true') {
  verbose(true);
}

const fixtureAppMap = (file: string): string => {
  return join(__dirname, 'fixtures', 'appmaps', file);
};

const scan = async (
  assertionPrototype: AssertionPrototype,
  appmapFile: string
): Promise<Finding[]> => {
  const appMapBytes = await readFile(fixtureAppMap(appmapFile), 'utf8');
  const appMapData = buildAppMap(appMapBytes).normalize().build();

  const findings: Finding[] = [];
  await new AssertionChecker().check(appMapData, assertionPrototype, findings);

  if (process.env.VERBOSE_TEST === 'true') {
    console.log(JSON.stringify(findings, null, 2));
  }

  return findings;
};

export { fixtureAppMap, scan };
