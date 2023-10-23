import readIndexFile from '../readIndexFile';

export default function collectHTTPServerRequests(
  appmapCountByHTTPServerRequestCount: Record<string, number>
) {
  return async (appmap: string) => {
    const httpServerRequests = await readIndexFile(appmap, 'canonical.httpServerRequests.json');
    if (!httpServerRequests) return;

    const requestCount = String(httpServerRequests.length);
    if (!appmapCountByHTTPServerRequestCount[requestCount])
      appmapCountByHTTPServerRequestCount[requestCount] = 1;
    else
      appmapCountByHTTPServerRequestCount[requestCount] =
        appmapCountByHTTPServerRequestCount[requestCount] + 1;
  };
}
