import { browserClient, reportError } from './RPC';

export default class Index {
  client: any;

  constructor(portOrClient: number | any) {
    this.client = typeof portOrClient === 'number' ? browserClient(portOrClient) : portOrClient;
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

  appmapMetadata(appmapId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.request('appmap.metadata', { appmap: appmapId }, function (err, error, result) {
        if (err || error) return reportError(reject, err, error);

        resolve(result as string);
      });
    });
  }
}
