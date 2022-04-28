import isAgentAvailable from '../test/isAgentAvailable';
import isRecordingInProgress from '../test/isRecordingInProgress';
import agentAvailableAndReady from './agentAvailableAndReady';
import agentIsRecording from './agentIsRecording';
import agentNotAvailable from './agentNotAvailable';
import { State } from '../types/state';
import RecordContext from '../recordContext';
import { locationString } from '../configuration';

// This is the initial state of remote recording. From here, the connection to the AppMap
// agent must be configured and verified, and then the recording will be run.
export default async function remote(
  recordContext: RecordContext
): Promise<State> {
  await recordContext.populateURL();
  if (await isAgentAvailable()) {
    if (!(await isRecordingInProgress())) {
      return agentAvailableAndReady;
    } else {
      return agentIsRecording;
    }
  } else {
    return agentNotAvailable;
  }
}
