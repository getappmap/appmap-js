import UI from '../../userInteraction';
import { requestOptions } from '../configuration';
import RemoteRecording from '../remoteRecording';

export default async function isAgentAvailable(): Promise<boolean> {
  const ro = await requestOptions();
  const locationStr = `${ro.protocol}//${ro.hostname}:${ro.port}${ro.path}`;
  UI.status = `Checking if the AppMap agent is available at ${locationStr}`;
  try {
    await new RemoteRecording(ro).status();
    UI.success(`AppMap agent is available at ${locationStr}`);
    return true;
  } catch (e: any) {
    UI.error(
      `AppMap agent is not avaliable at ${locationStr}: ${e.toString()}`
    );
    return false;
  }
}
