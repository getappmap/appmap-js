import { SearchRpc } from '@appland/rpc';

export default function appmapLocation(appmap: string, event?: SearchRpc.EventMatch): string {
  const appmapFile = [appmap, 'appmap.json'].join('.');
  const tokens = [appmapFile];
  if (event?.eventIds.length) tokens.push(String(event.eventIds[0]));
  return tokens.join(':');
}
