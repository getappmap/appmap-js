import { AppMap as AppMapStruct, buildAppMap } from '@appland/models';

const APPMAP_UPLOAD_MAX_SIZE = parseInt(process.env.APPMAP_UPLOAD_MAX_SIZE || '40960') * 1024;
if (!APPMAP_UPLOAD_MAX_SIZE) {
  throw Error(`Failed parsing APPMAP_UPLOAD_MAX_SIZE: "${process.env.APPMAP_UPLOAD_MAX_SIZE}"`);
}
export function maxAppMapSize(): number {
  return APPMAP_UPLOAD_MAX_SIZE;
}

export function pruneAppMap(appMapJson: Record<string, unknown>, maxSize: number): AppMapStruct {
  return buildAppMap().source(appMapJson).prune(maxSize).normalize().build();
}
