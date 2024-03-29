import UI from '../../userInteraction';
import RecordContext from '../recordContext';
import RemoteRecording from '../remoteRecording';

export default async function startRecording({ configuration }: RecordContext) {
  const ro = configuration.requestOptions();

  UI.progress('');
  await UI.continue('Press enter to start recording');

  const rr = new RemoteRecording(ro);
  await rr.start();

  UI.progress(`
Now, interact with your app in any way you'd like. Click through the UI, run Selenium tests that interact with it, make web service calls, etc.
`);
}
