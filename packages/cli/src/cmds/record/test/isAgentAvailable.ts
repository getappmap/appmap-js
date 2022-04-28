import UI from '../../userInteraction';
import { locationString, requestOptions } from '../configuration';
import RemoteRecording from '../remoteRecording';

export default async function isAgentAvailable(): Promise<boolean> {
  const ro = await requestOptions();
  UI.status = `Checking if the AppMap agent is available at ${locationString()}`;
  try {
    await new RemoteRecording(ro).status();
    UI.success(`AppMap agent is available at ${locationString()}`);
    return true;
  } catch (e: any) {
    UI.error(
      `AppMap agent is not avaliable at ${locationString()}: ${e.toString()}`
    );
    return false;
  }
}
