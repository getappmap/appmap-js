import { AppMap, buildAppMap } from '@appland/models';
import { Telemetry } from '@appland/telemetry';
import { readFile } from 'fs/promises';
import { join } from 'path';
import RuleChecker from '../src/ruleChecker';
import { fileExists, verbose } from '../src/rules/lib/util';
import Check from '../src/check';
import AppMapIndex from '../src/appMapIndex';
import { Finding } from '../src';

if (process.env.VERBOSE_SCAN === 'true' || process.env.DEBUG === 'true') {
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
  let fileName: string;
  if (await fileExists(file)) fileName = file;
  else fileName = fixtureAppMapFileName(file);

  const appMapBytes = await readFile(fileName, 'utf8');
  return buildAppMap(appMapBytes).normalize().build();
};

const scan = async (
  check: Check,
  appMapFile: string,
  appMap?: AppMap
): Promise<{ appMap: AppMap; findings: Finding[] }> => {
  let appMapData: AppMap;
  if (appMap) {
    appMapData = appMap!;
  } else {
    appMapData = await fixtureAppMap(appMapFile);
  }
  const appMapIndex = new AppMapIndex(appMapData);

  const findings: Finding[] = [];
  await new RuleChecker().check(appMapFile, appMapIndex, check, findings);

  if (process.env.VERBOSE_TEST === 'true') {
    console.log(JSON.stringify(findings, null, 2));
  }

  return { appMap: appMapData, findings };
};

// Stub telemetry by spying on the shared Telemetry singleton. This must mutate the
// same instance the code under test imported, so spy on the object rather than
// jest.mock()-ing the module in a beforeEach (which can't replace an already-imported
// binding, letting the real client — and a real network/git call — run in tests).
let telemetrySpy: jest.SpyInstance | undefined;

const stubTelemetry = (): void => {
  telemetrySpy = jest.spyOn(Telemetry, 'sendEvent').mockImplementation(() => undefined);
};

const unstubTelemetry = (): void => {
  telemetrySpy?.mockRestore();
  telemetrySpy = undefined;
};

export { fixtureAppMap, fixtureAppMapFileName, scan, stubTelemetry, unstubTelemetry };
