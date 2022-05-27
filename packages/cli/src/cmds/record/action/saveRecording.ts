import { mkdirp } from 'fs-extra';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import UI from '../../userInteraction';
import { readConfigOption, requestOptions } from '../configuration';
import RecordContext from '../recordContext';
import RemoteRecording from '../remoteRecording';

export default async function saveRecording(
  recordContext: RecordContext
): Promise<string | undefined> {
  const rr = new RemoteRecording(await requestOptions());
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

  if (jsonData.events) recordContext.appMapEventCount = jsonData.events.length;

  jsonData['metadata'] = jsonData['metadata'] || {};
  jsonData['metadata']['name'] = appMapName;
  data = JSON.stringify(jsonData);

  const fileName = `${appMapName}.appmap.json`;
  const outputDir = join(
    (await readConfigOption('appmap_dir', 'tmp/appmap')) as string,
    'remote'
  );
  await mkdirp(outputDir);

  UI.status = `Saving recording to ${fileName} in directory ${outputDir}`;

  await writeFile(join(outputDir, fileName), data);

  UI.success('AppMap saved');

  return join(outputDir, fileName);
}
