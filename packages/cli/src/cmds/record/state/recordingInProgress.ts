import stopRecording from '../action/stopRecording';
import { State } from '../types/state';
import recordingStopped from './recordingStopped';

// User has started the recording and is now performing the actions that will be recorded.
export default async function recordingInProgress(): Promise<State> {
  await stopRecording();
  return recordingStopped;
}
