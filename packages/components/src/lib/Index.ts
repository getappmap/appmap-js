import { browserClient, reportError } from './RPC';

export default class IndexClient {
  client: any;

  constructor(port: number) {
    this.client = browserClient(port);
  }

  appmapData(appmapId: string, filter: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request(
        'appmap.data',
        { appmap: appmapId, filter },
        function (err, error, result) {
          if (err || error) return reportError(reject, err, error);

          resolve(result as string);
        }
      );
    });
  }
}
