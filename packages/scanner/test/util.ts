import { AppMap, buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { join } from 'path';
import AssertionChecker from '../src/assertionChecker';
import { verbose } from '../src/scanner/util';
import { AssertionPrototype, Finding } from '../src/types';

if (process.env.VERBOSE_SCAN === 'true') {
  verbose(true);
}

const fixtureAppMapFileName = (file: string): string => {
  return join(__dirname, 'fixtures', 'appmaps', file);
};

const fixtureAppMap = async (file: string): Promise<AppMap> => {
  const appMapBytes = await readFile(fixtureAppMapFileName(file), 'utf8');
  return buildAppMap(appMapBytes).normalize().build();
};

const scan = async (
  assertionPrototype: AssertionPrototype,
  appmapFile?: string,
  appmap?: AppMap
): Promise<Finding[]> => {
  let appMapData: AppMap;
  if (appmapFile) {
    appMapData = await fixtureAppMap(appmapFile);
  } else {
    appMapData = appmap!;
  }

  const findings: Finding[] = [];
  await new AssertionChecker().check(appMapData, assertionPrototype, findings);

  if (process.env.VERBOSE_TEST === 'true') {
    console.log(JSON.stringify(findings, null, 2));
  }

  return findings;
};

export { fixtureAppMap, fixtureAppMapFileName, scan };
