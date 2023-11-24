export function appmapFile(appmapId: string) {
  if (appmapId.endsWith('.appmap.json')) return appmapId;

  return `${appmapId}.appmap.json`;
}
