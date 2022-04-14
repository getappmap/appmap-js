import { requestOptions } from '../configuration';
import RemoteRecording from '../remoteRecording';

export default async function isRecordingInProgress(
): Promise<boolean> {
  const status = await new RemoteRecording(await requestOptions()).status();
  return status.enabled === true;
}
