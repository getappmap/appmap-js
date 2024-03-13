export function packRef(directory: string, appmapId: string): string {
  return JSON.stringify({ directory, appmapId });
}

export function refToAppMapDir(ref: string): string {
  const { directory, appmapId } = unpackRef(ref);
  return [directory, appmapId].join('/');
}

export function unpackRef(ref: string): { directory: string; appmapId: string } {
  return JSON.parse(ref);
}
