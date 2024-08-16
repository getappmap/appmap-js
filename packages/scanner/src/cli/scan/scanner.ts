import { loadConfig } from '../../configuration/configurationProvider';
import Configuration from '../../configuration/types/configuration';

import scan from '../scan';
import { ScanResults } from '../../report/scanResults';

export interface Scanner {
  scan(): Promise<ScanResults>;
  scan(skipErrors: boolean): Promise<ScanResults>;
}

export default async function scanner(
  configuration: Configuration,
  files: string[]
): Promise<Scanner> {
  return new StandaloneScanner(configuration, files);
}

abstract class ScannerBase {
  constructor(public configuration: Configuration, public files: string[]) {}

  async scan(skipErrors = false): Promise<ScanResults> {
    const checks = await loadConfig(this.configuration);
    const { appMapMetadata, findings } = await scan(this.files, checks, skipErrors);
    return new ScanResults(this.configuration, appMapMetadata, findings, checks);
  }
}

class StandaloneScanner extends ScannerBase implements Scanner {
  async verifyServerConfiguration(): Promise<boolean> {
    return true;
  }
}
