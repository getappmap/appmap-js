import UI from '../../userInteraction';
import { RemoteRecordingError } from '../makeRequest';
import RecordContext from '../recordContext';
import RemoteRecording from '../remoteRecording';

export default async function isAgentAvailable(recordContext: RecordContext): Promise<boolean> {
  const { configuration } = recordContext;
  const ro = configuration.requestOptions();
  const location = configuration.locationString();
  UI.status = `Checking if the AppMap agent is available at ${location}`;
  try {
    await new RemoteRecording(ro).status();
    UI.success(`AppMap agent is available at ${location}`);
    return true;
  } catch (e: any) {
    if (e instanceof RemoteRecordingError) {
      recordContext.remoteError = e;
    }
    UI.error(`AppMap agent is not available at ${location}.`);
    if (await UI.confirm(`Would you like to see the server's response?`)) {
      UI.error(e.toString());
    }
    return false;
  }
}
