import { join } from 'path';

export function packRef(directory: string, appmapId: string): string {
  return JSON.stringify({ directory, appmapId });
}

export function refToAppMapDir(ref: string): string {
  const { directory, appmapId } = unpackRef(ref);
  return join(directory, appmapId);
}

export function unpackRef(ref: string): { directory: string; appmapId: string } {
  return JSON.parse(ref);
}
