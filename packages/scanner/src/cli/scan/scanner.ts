import { loadConfiguration, FindingStatusListItem } from '@appland/client';

import { loadConfig } from '../../configuration/configurationProvider';
import Configuration from '../../configuration/types/configuration';
import fetchStatus from '../../integration/appland/fetchStatus';

import resolveAppId from '../resolveAppId';
import scan from '../scan';
import { ScanResults } from '../../report/scanResults';

interface Scanner {
  scan(): Promise<ScanResults>;

  fetchFindingStatus(appId?: string, appMapDir?: string): Promise<FindingStatusListItem[]>;
}

export default function scanner(
  reportAllFindings: boolean,
  configuration: Configuration,
  files: string[]
): Scanner {
  return reportAllFindings
    ? new StandaloneScanner(configuration, files)
    : new ServerIntegratedScanner(configuration, files);
}

abstract class ScannerBase {
  constructor(public configuration: Configuration, public files: string[]) {}

  async scan(): Promise<ScanResults> {
    await this.verifyServerConfiguration();

    const checks = await loadConfig(this.configuration);
    const { appMapMetadata, findings } = await scan(this.files, checks);
    return new ScanResults(this.configuration, appMapMetadata, findings, checks);
  }

  protected abstract verifyServerConfiguration(): Promise<boolean>;
}

class ServerIntegratedScanner extends ScannerBase implements Scanner {
  async verifyServerConfiguration(): Promise<boolean> {
    return new Promise((resolve) => {
      loadConfiguration()
        .then(() => resolve(true))
        .catch((err) => {
          console.warn(`⚠️ Notice ⚠️`);
          console.warn(`⚠️ AppMap Server configuration is not available.`);
          console.warn(`⚠️ Detailed message: ${err.toString()}`);
          console.warn(
            `⚠️ Scanning will continue without fetching existing findings from the server.`
          );
          resolve(false);
        });
    });
  }

  async fetchFindingStatus(
    appIdArg?: string,
    appMapDir?: string
  ): Promise<FindingStatusListItem[]> {
    const appId = await resolveAppId(appIdArg, appMapDir);
    return await fetchStatus(appId);
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
