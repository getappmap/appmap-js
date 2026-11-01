import { RequestOptions } from 'http';
import UI from '../../userInteraction';
import RecordContext from '../recordContext';
import RemoteRecording from '../remoteRecording';

export default async function cancelRecording({
  configuration,
}: RecordContext): Promise<void> {
  await new RemoteRecording(configuration.requestOptions()).stop();
  UI.success('The recording has been cancelled.');
}
