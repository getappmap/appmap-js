import saveRecording from '../action/saveRecording';
import RecordContext from '../recordContext';
import { FileName } from '../types/fileName';

// Recording has been completed.
export default async function recordingStopped(
  recordContext: RecordContext
): Promise<FileName | undefined> {
  return saveRecording(recordContext);
}
