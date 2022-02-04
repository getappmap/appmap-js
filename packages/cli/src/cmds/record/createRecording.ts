import { RequestOptions } from 'http';
import UI from '../userInteraction';
import RemoteRecording from './remoteRecording';
import { promises as fs } from 'fs';

export default async function createRecording(
  requestOptions: RequestOptions
): Promise<string | undefined> {
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

  let data = await rr.stop();

  if (data) {
    UI.success(`Recording has finished, with ${data.length} bytes of data.`);
  } else {
    UI.warn(`Recording was stopped, but no data was obtained.`);
    return;
  }

  const { appMapName } = await UI.prompt({
    type: 'input',
    name: 'appMapName',
    message: 'Choose a name for your AppMap:',
    default: 'My recording',
  });

  const jsonData = JSON.parse(data);
  jsonData['metadata'] = jsonData['metadata'] || {};
  jsonData['metadata']['name'] = appMapName;
  data = JSON.stringify(jsonData);

  const fileName = `${appMapName}.appmap.json`;
  UI.status = `Saving recording to ${fileName}`;
  fs.writeFile(fileName, data);

  UI.success('AppMap saved');

  return fileName;
}
