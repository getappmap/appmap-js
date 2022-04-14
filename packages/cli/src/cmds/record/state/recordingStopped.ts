import saveRecording from '../action/saveRecording';
import { FileName } from '../types/fileName';

// Recording has been completed.
export default async function recordingStopped(): Promise<
  FileName | undefined
> {
  return saveRecording();
}
