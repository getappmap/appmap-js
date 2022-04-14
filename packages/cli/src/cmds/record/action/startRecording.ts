import UI from '../../userInteraction';
import { requestOptions } from '../configuration';
import RemoteRecording from '../remoteRecording';

export default async function startRecording() {
  const ro = await requestOptions();

  UI.progress('');
  await UI.confirm('Press enter to start recording');

  const rr = new RemoteRecording(ro);
  await rr.start();

  UI.progress(`
Now, interact with your app in any way you'd like. Click through the UI, run Selenium tests that interact with it, make web service calls, etc.
`);
}
