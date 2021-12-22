import { App, FindingStatusListItem } from '@appland/client';

export default async function (appId: string): Promise<FindingStatusListItem[]> {
  return await new App(appId).listFindingStatus();
}
