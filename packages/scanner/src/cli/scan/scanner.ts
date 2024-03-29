import { loadConfiguration, App, FindingStatusListItem } from '@appland/client/dist/src';

import { loadConfig } from '../../configuration/configurationProvider';
import Configuration from '../../configuration/types/configuration';

import resolveAppId from '../resolveAppId';
import scan from '../scan';
import { ScanResults } from '../../report/scanResults';

export interface Scanner {
  scan(): Promise<ScanResults>;
  scan(skipErrors: boolean): Promise<ScanResults>;

  fetchFindingStatus(appId?: string, appMapDir?: string): Promise<FindingStatusListItem[]>;
}

export default async function scanner(
  reportAllFindings: boolean,
  configuration: Configuration,
  files: string[]
): Promise<Scanner> {
  if (reportAllFindings) {
    return new StandaloneScanner(configuration, files);
  } else {
    await loadConfiguration();
    return new ServerIntegratedScanner(configuration, files);
  }
}

abstract class ScannerBase {
  constructor(public configuration: Configuration, public files: string[]) {}

  async scan(skipErrors = false): Promise<ScanResults> {
    const checks = await loadConfig(this.configuration);
    const { appMapMetadata, findings } = await scan(this.files, checks, skipErrors);
    return new ScanResults(this.configuration, appMapMetadata, findings, checks);
  }
}

class ServerIntegratedScanner extends ScannerBase implements Scanner {
  async fetchFindingStatus(
    appIdArg?: string,
    appMapDir?: string
  ): Promise<FindingStatusListItem[]> {
    const appId = await resolveAppId(appIdArg, appMapDir);
    return await new App(appId).listFindingStatus();
  }
}

class StandaloneScanner extends ScannerBase implements Scanner {
  async verifyServerConfiguration(): Promise<boolean> {
    return true;
  }

  async fetchFindingStatus(): Promise<FindingStatusListItem[]> {
    return [];
  }
}
