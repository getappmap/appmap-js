import UI from '../../userInteraction';
import RecordContext from '../recordContext';
import RemoteRecording from '../remoteRecording';

export default async function isAgentAvailable({
  configuration,
}: RecordContext): Promise<boolean> {
  const ro = configuration.requestOptions();
  const location = configuration.locationString();
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
