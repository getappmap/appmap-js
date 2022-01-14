import { AppMap, buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { join } from 'path';
import RuleChecker from '../src/ruleChecker';
import { verbose } from '../src/rules/lib/util';
import { Finding } from '../src/types';
import Check from '../src/check';

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

const scan = async (check: Check, appMapFile: string, appMap?: AppMap): Promise<Finding[]> => {
  let appMapData: AppMap;
  if (appMap) {
    appMapData = appMap!;
  } else {
    appMapData = await fixtureAppMap(appMapFile);
  }

  const findings: Finding[] = [];
  await new RuleChecker().check(appMapFile, appMapData, check, findings);

  if (process.env.VERBOSE_TEST === 'true') {
    console.log(JSON.stringify(findings, null, 2));
  }

  return findings;
};

export { fixtureAppMap, fixtureAppMapFileName, scan };
