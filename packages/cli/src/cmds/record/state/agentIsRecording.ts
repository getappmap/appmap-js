import promptRecordingInProgress, {
  RecordingAction,
} from '../prompt/recordingInProgress';
import cancelRecording from '../action/cancelRecording';
import serverAvailableAndReady from './agentAvailableAndReady';
import saveRecording from '../action/saveRecording';
import { State } from '../types/state';
import abort from './abort';
import RecordContext from '../recordContext';

export default async function agentIsRecording(
  recordContext: RecordContext
): Promise<State> {
  const recordingAction = await promptRecordingInProgress();

  if (recordingAction === RecordingAction.Cancel) {
    await cancelRecording(recordContext);
    return serverAvailableAndReady;
  } else if (recordingAction === RecordingAction.Save) {
    await saveRecording(recordContext);
    return serverAvailableAndReady;
  } else {
    return abort;
  }
}
