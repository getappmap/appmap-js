import UI from '../../userInteraction';
import { locationString, requestOptions } from '../configuration';
import RemoteRecording from '../remoteRecording';

export default async function isAgentAvailable(): Promise<boolean> {
  const ro = await requestOptions();
  const location = await locationString();
  UI.status = `Checking if the AppMap agent is available at ${location}`;
  try {
    await new RemoteRecording(ro).status();
    UI.success(`AppMap agent is available at ${location}`);
     return true;
  } catch (e: any) {
    UI.error(`AppMap agent is not avaliable at ${location}: ${e.toString()}`);
    return false;
  }
}
