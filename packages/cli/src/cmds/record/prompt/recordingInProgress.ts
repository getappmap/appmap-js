import UI from '../../userInteraction';

export enum RecordingAction {
  Cancel = 'cancel recording',
  Save = 'save recording',
  Abort = 'continue recording',
}

export default async function recordingInProgress(): Promise<RecordingAction> {
  UI.progress('The AppMap agent is already recording an AppMap.?');
  const { recordingAction } = await UI.prompt({
    type: 'list',
    choices: [
      RecordingAction.Cancel,
      RecordingAction.Save,
      RecordingAction.Abort,
    ],
    name: 'recordingAction',
    message: "What would you like to do with the recording that's in progress?",
  });
  return recordingAction;
}
