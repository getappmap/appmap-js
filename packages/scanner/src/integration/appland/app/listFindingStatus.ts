import { App, FindingStatusListItem } from '@appland/client/dist/src';

export default async function listFindingStatus(appId: string): Promise<FindingStatusListItem[]> {
  return await new App(appId).listFindingStatus();
}
