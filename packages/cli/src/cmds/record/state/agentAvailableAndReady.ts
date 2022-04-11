import startRecording from '../action/startRecording';
import recordingInProgress from './recordingInProgress';
import { State } from '../types/state';

// The AppMap agent has been confirmed
export default async function agentAvailableAndReady(): Promise<State> {
  await startRecording();
  return recordingInProgress;
}
