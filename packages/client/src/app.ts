import { stringify } from 'querystring';
import Mapset from './mapset';
import FindingStatusListItem from './findingStatusListItem';
import reportJson from './reportJson';
import get from './get';

export default class {
  constructor(public fqname: string) {}

  mapset(mapsetId: number) {
    return new Mapset(this, mapsetId);
  }

  async listFindingStatus(): Promise<FindingStatusListItem[]> {
    const requestPath = ['api', this.fqname, 'finding_status'].join('/');
    return get(requestPath).then((response) =>
      reportJson<FindingStatusListItem[]>(response)
    );
  }

  async scannerConfig(branchName?: string): Promise<Record<string, any>> {
    const parameters: Record<string, string> = {};
    if (branchName) parameters.branch = branchName;
    const requestPath = ['api', this.fqname, 'scanner_config'].join('/');
    const requestURI = [requestPath];
    if (Object.keys(parameters).length > 0)
      requestURI.push(stringify(parameters));
    return get(requestURI.filter(Boolean).join('?')).then((response) =>
      reportJson(response)
    );
  }
}
