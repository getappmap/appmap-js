import { IncomingMessage, RequestOptions } from 'http';
import UI from '../userInteraction';
import configureConnection from './configureConnection';
import { ExitCode } from './exitCode';
import RemoteRecording from './remoteRecording';
import saveRecording from './saveRecording';
import { RemoteRecordingStatus } from './types';

export default async function testConnection(requestOptions: RequestOptions) {
  const retryConnection = async () => {
    const { reconfigure } = await UI.prompt({
      type: 'confirm',
      name: 'reconfigure',
      message: 'Do you want to change any of the server connection parameters?',
    });
    if (reconfigure) {
      await configureConnection(requestOptions);
    }
    await testConnection(requestOptions);
  };

  UI.status = `Performing a test connection to the app`;

  enum RecordingAction {
    Cancel = 'cancel recording',
    Save = 'save recording',
    Abort = 'continue recording',
  }

  let status: RemoteRecordingStatus | null = null;
  while (!status) {
    try {
      status = await new RemoteRecording(requestOptions).status();
      UI.success(`Great! I am able to connect to the AppMap agent.`);

      if (status.enabled) {
        UI.progress('The AppMap agent is already recording an AppMap.?');
        const { recordingAction } = await UI.prompt({
          type: 'list',
          choices: [
            RecordingAction.Cancel,
            RecordingAction.Save,
            RecordingAction.Abort,
          ],
          name: 'recordingAction',
          message:
            "What would you like to do with the recording that's in progress?",
        });

        if (recordingAction === RecordingAction.Cancel) {
          await new RemoteRecording(requestOptions).stop();
          UI.success('The recording has been cancelled.');
        } else if (recordingAction === RecordingAction.Save) {
          const rr = new RemoteRecording(requestOptions);
          await saveRecording(rr);
        } else {
          UI.progress(
            'This program will exit now. You can run it again later to make a new recording.'
          );
          process.exit(ExitCode.Quit);
        }
      }
    } catch (e) {
      UI.error(
        `Uh-oh. I can't connect to the AppMap agent there. The error I got is:\n\n${e}\n`
      );
      await retryConnection();
    }
  }
}
