import { warn } from 'console';
import readIndexFile from '../readIndexFile';

export default function collectHTTPClientRequests(
  clientRouteCountByResource: Record<string, number>,
  resourceTokens: number
) {
  return async (appmap: string) => {
    const httpClientRequests = await readIndexFile(appmap, 'canonical.httpClientRequests.json');
    for (const request of httpClientRequests) {
      const { route } = request;
      const [_method, urlStr] = route.split(' ');
      let hostname: string | undefined, path: string;
      try {
        const url = new URL(urlStr);
        hostname = url.hostname;
        path = url.pathname;
      } catch {
        warn(`Error parsing URL: ${urlStr}`);
        path = urlStr;
      }
      let directoryIsh = path.split('/').slice(0, resourceTokens).join('/');
      if (hostname) directoryIsh = [hostname, directoryIsh].join('');
      if (!clientRouteCountByResource[directoryIsh]) clientRouteCountByResource[directoryIsh] = 1;
      else clientRouteCountByResource[directoryIsh] = clientRouteCountByResource[directoryIsh] + 1;
    }
  };
}
