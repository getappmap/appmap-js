import { RequestOptions } from 'http';
import UI from '../userInteraction';
import RemoteRecording from './remoteRecording';
import { promises as fs } from 'fs';

export default async function createRecording(requestOptions: RequestOptions) {
  await UI.prompt({
    type: 'confirm',
    name: 'startRecording',
    message: 'Start recording?',
    default: 'y',
  });

  const rr = new RemoteRecording(requestOptions);
  rr.start();

  UI.progress('\nRecording started.\n');
  UI.progress(
    `Now, interact with your app in any way you'd like. Click through the UI, run Selenium tests that interact with it, make web service calls, whatever you like.`
  );

  UI.status = 'Recording is active';

  await UI.prompt({
    type: 'confirm',
    name: 'stopRecording',
    message: 'Stop recording?',
    default: 'y',
  });

  const data = await rr.stop();

  UI.success(`Recording has finished, with ${data!.length} bytes of data.`);

  const { appMapName } = await UI.prompt({
    type: 'input',
    name: 'appMapName',
    message: 'Choose a name for your AppMap:',
    default: 'My recording',
  });

  const fileName = `${appMapName}.appmap.json`;
  UI.status = `Saving recording to ${fileName}`;
  fs.writeFile(fileName, data!);

  UI.success('AppMap saved');
}
