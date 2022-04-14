import UI from '../../userInteraction';
import { requestOptions } from '../configuration';
import RemoteRecording from '../remoteRecording';

export default async function cancelRecording(): Promise<void> {
  await new RemoteRecording(await requestOptions()).stop();
  UI.success('The recording has been cancelled.');
}
