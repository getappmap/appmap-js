import UI from '../../userInteraction';
import { requestOptions } from '../configuration';
import RemoteRecording from '../remoteRecording';

export default async function isAgentAvailable(): Promise<boolean> {
  const ro = await requestOptions();
  UI.status = `Checking if the AppMap agent is available at ${ro.protocol}//${ro.hostname}:${ro.port}${ro.path}`;
  try {
    await new RemoteRecording(ro).status();
    UI.success();
    return true;
  } catch (e) {
    UI.error();
    return false;
  }
}
