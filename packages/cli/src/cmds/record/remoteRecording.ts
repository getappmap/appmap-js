import { RequestOptions } from 'http';
import makeRequest from './makeRequest';
import { RemoteRecordingStatus } from './types/remoteRecordingStatus';

export default class RemoteRecording {
  constructor(public requestOptions: RequestOptions) {}

  async start(): Promise<boolean> {
    const statusCode = (
      await makeRequest(
        this,
        `${this.requestOptions.path}_appmap/record`,
        'POST',
        'starting recording',
        [200, 201, 409]
      )
    ).statusCode;

    if (statusCode < 300) {
      return true;
    } else {
      return false;
    }
  }

  async status(): Promise<RemoteRecordingStatus> {
    return JSON.parse(
      (
        await makeRequest(
          this,
          `${this.requestOptions.path}_appmap/record`,
          'GET',
          'checking recording status'
        )
      ).data
    );
  }

  async stop(): Promise<string | null> {
    const { statusCode, data } = await makeRequest(
      this,
      `${this.requestOptions.path}_appmap/record`,
      'DELETE',
      'stopping recording',
      [200, 404]
    );

    if (statusCode === 200) {
      return data;
    } else {
      return null;
    }
  }
}
