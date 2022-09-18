import startRecording from '../action/startRecording';
import recordingInProgress from './recordingInProgress';
import { State } from '../types/state';
import RecordContext from '../recordContext';

// The AppMap agent has been confirmed
export default async function agentAvailableAndReady(recordContext: RecordContext): Promise<State> {
  await startRecording(recordContext);
  return recordingInProgress;
}
