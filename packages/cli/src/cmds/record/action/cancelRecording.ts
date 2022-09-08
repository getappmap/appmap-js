import { RequestOptions } from 'http';
import UI from '../../userInteraction';
import RecordContext from '../recordContext';
import RemoteRecording from '../remoteRecording';

export default async function cancelRecording({
  configuration: { requestOptions },
}: RecordContext): Promise<void> {
  await new RemoteRecording(requestOptions()).stop();
  UI.success('The recording has been cancelled.');
}
