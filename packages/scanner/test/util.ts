import { AppMap, buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Assertion from '../src/assertion';
import AssertionChecker from '../src/assertionChecker';
import { verbose } from '../src/scanner/util';
import {
  AssertionConfig,
  AssertionPrototype,
  Finding,
  MatchPatternConfig,
  ScopeName,
} from '../src/types';

if (process.env.VERBOSE_SCAN === 'true') {
  verbose(true);
}

const fixtureAppMapFileName = (file: string): string => {
  if (file.split('/').length === 1) {
    return join(__dirname, 'fixtures', 'appmaps', file);
  } else {
    return join(__dirname, 'fixtures', file);
  }
};

const fixtureAppMap = async (file: string): Promise<AppMap> => {
  const appMapBytes = await readFile(fixtureAppMapFileName(file), 'utf8');
  return buildAppMap(appMapBytes).normalize().build();
};

const makePrototype = (
  id: string,
  buildFn: () => Assertion,
  enumerateScope: boolean | undefined,
  scope: ScopeName | undefined,
  include: MatchPatternConfig[] | undefined = undefined,
  exclude: MatchPatternConfig[] | undefined = undefined
): AssertionPrototype => {
  const config = { id } as AssertionConfig;
  if (include) {
    config.include = include;
  }
  if (exclude) {
    config.exclude = exclude;
  }
  return {
    config: config,
    enumerateScope: enumerateScope === true ? true : false,
    scope: scope || 'root',
    build: buildFn,
  } as AssertionPrototype;
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

export { fixtureAppMap, fixtureAppMapFileName, makePrototype, scan };
