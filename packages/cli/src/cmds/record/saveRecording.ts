import { writeFile } from 'fs/promises';
import UI from '../userInteraction';
import RemoteRecording from './remoteRecording';

export default async function saveRecording(
  rr: RemoteRecording
): Promise<string | undefined> {
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
  await writeFile(fileName, data);

  UI.success('AppMap saved');

  return fileName;
}
