import isAgentAvailable from '../test/isAgentAvailable';
import isRecordingInProgress from '../test/isRecordingInProgress';
import agentAvailableAndReady from './agentAvailableAndReady';
import agentIsRecording from './agentIsRecording';
import agentNotAvailable from './agentNotAvailable';
import { State } from '../types/state';

// This is the initial state of the record command. From here, the connection to the AppMap
// agent must be configured and verified, and then the recording will be run.
export default async function initial(): Promise<State> {
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
