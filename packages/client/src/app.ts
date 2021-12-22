import { FindingStatusListItem } from '.';
import reportJson from './reportJson';
import get from './get';

export default class {
  constructor(public fqname: string) {}

  async listFindingStatus(): Promise<FindingStatusListItem[]> {
    const requestPath = ['api', this.fqname, 'finding_status'].join('/');
    return get(requestPath).then((response) =>
      reportJson<FindingStatusListItem[]>(response)
    );
  }
}
