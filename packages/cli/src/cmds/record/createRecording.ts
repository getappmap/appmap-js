import { RequestOptions } from 'http';
import UI from '../userInteraction';
import RemoteRecording from './remoteRecording';
import { promises as fs } from 'fs';
import saveRecording from './saveRecording';

export default async function createRecording(
  requestOptions: RequestOptions
): Promise<string | undefined> {
  UI.progress(
    `The AppMap agent is ready at ${requestOptions.hostname}:${requestOptions.port}`
  );

  await UI.prompt({
    type: 'confirm',
    name: 'startRecording',
    message: 'Press enter to start recording',
  });

  const rr = new RemoteRecording(requestOptions);
  rr.start();

  UI.progress('\nRecording started.\n');
  UI.progress(
    `Now, interact with your app in any way you'd like. Click through the UI, run Selenium tests that interact with it, make web service calls, whatever you like.`
  );

  UI.status = 'Recording is active';

  await UI.prompt({
    type: 'confirm',
    name: 'stopRecording',
    message: 'Press enter to stop recording',
  });

  return saveRecording(rr);
}
