import UI from '../../userInteraction';
import RecordContext from '../recordContext';
import RemoteRecording from '../remoteRecording';
import nameAppMap from './nameAppMap';
import saveAppMap from './saveAppMap';

export default async function saveRecording(
  recordContext: RecordContext
): Promise<string | undefined> {
  const rr = new RemoteRecording(recordContext.configuration.requestOptions());
  let data = await rr.stop();

  if (data) {
    UI.success(`Recording has finished, with ${data.length} bytes of data.`);
  } else {
    UI.warn(`Recording was stopped, but no data was obtained.`);
    recordContext.appMapCount = 0;
    recordContext.appMapEventCount = 0;
    return;
  }
  const jsonData = JSON.parse(data);

  if (jsonData.events) {
    recordContext.appMapCount = 1;
    recordContext.appMapEventCount = jsonData.events.length;
  }

  const appMapName = await nameAppMap(jsonData);
  return saveAppMap(recordContext, jsonData, appMapName);
}
