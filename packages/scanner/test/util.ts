import { buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Assertion from '../src/assertion';
import AssertionChecker from '../src/assertionChecker';
import { verbose } from '../src/scanner/util';
import { Finding } from '../src/types';

if (process.env.VERBOSE_SCAN === 'true') {
  verbose(true);
}

const fixtureAppMap = (file: string): string => {
  return join(__dirname, 'fixtures', 'appmaps', file);
};

const scan = async (assertion: Assertion, appmapFile: string): Promise<Finding[]> => {
  const appMapBytes = await readFile(fixtureAppMap(appmapFile), 'utf8');
  const appMapData = buildAppMap(appMapBytes).normalize().build();

  const findings: Finding[] = [];
  new AssertionChecker().check(appMapData, assertion, findings);

  if (process.env.VERBOSE_TEST === 'true') {
    console.log(JSON.stringify(findings, null, 2));
  }

  return findings;
};

export { fixtureAppMap, scan };
