import {
  loadConfiguration as loadClientConfiguration,
  App,
  FindingStatusListItem,
} from '@appland/client/dist/src';

import { loadConfig } from '../../configuration/configurationProvider';
import Configuration from '../../configuration/types/configuration';

import resolveAppId from '../resolveAppId';
import scan from '../scan';
import { ScanResults } from '../../report/scanResults';
import { FindingState, loadFindingsState } from '../findingsState';
import { merge } from '../../integration/appland/scannerJob/merge';

export default class Scanner {
  constructor(public configuration: Configuration, public files: string[]) {}

  async scan(skipErrors = false): Promise<ScanResults> {
    loadClientConfiguration();

    const checks = await loadConfig(this.configuration);
    const { appMapMetadata, findings } = await scan(this.files, checks, skipErrors);
    return new ScanResults(this.configuration, appMapMetadata, findings, checks);
  }

  async fetchFindingStatus(
    stateFileName: string,
    appIdArg?: string,
    appMapDir?: string
  ): Promise<FindingStatusListItem[]> {
    let findingStatus: FindingStatusListItem[] = [];

    const appId = await resolveAppId(appIdArg, appMapDir);
    if (appId) findingStatus = await new App(appId).listFindingStatus();

    const clientFindingsState = await loadFindingsState(stateFileName);
    Object.keys(clientFindingsState).forEach((state): void => {
      const items = clientFindingsState[state as FindingState];
      items.forEach((item) => {
        findingStatus.push({
          app_id: appId,
          identity_hash: item.hash_v2,
          status: state,
        } as FindingStatusListItem);
      });
    });
    return findingStatus;
  }
}
