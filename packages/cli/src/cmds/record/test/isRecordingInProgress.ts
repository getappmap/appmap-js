import RecordContext from '../recordContext';
import RemoteRecording from '../remoteRecording';

export default async function isRecordingInProgress({
  configuration,
}: RecordContext): Promise<boolean> {
  const status = await new RemoteRecording(
    configuration.requestOptions()
  ).status();
  return status.enabled === true;
}
