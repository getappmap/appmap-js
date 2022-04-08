import { RequestOptions } from 'http';
import RemoteRecording from './remoteRecording';
import { RemoteRecordingStatus } from './types';

export default async function serverAvailableAndWaiting(
  requestOptions: RequestOptions
): Promise<boolean> {
  let status: RemoteRecordingStatus | null = null;
  try {
    status = await new RemoteRecording(requestOptions).status();
    return status.enabled === false;
  } catch (e) {
    return false;
  }
}
