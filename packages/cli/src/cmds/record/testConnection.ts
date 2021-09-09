import { IncomingMessage, RequestOptions } from 'http';
import UI from '../userInteraction';
import configureConnection from './configureConnection';
import RemoteRecording from './remoteRecording';
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

  let status: RemoteRecordingStatus | null = null;
  while (!status) {
    try {
      status = await new RemoteRecording(requestOptions).status();
      UI.success(`Great! I am able to connect to the AppMap agent.`);
    } catch (e) {
      UI.error(
        `Uh-oh. I can't connect to the AppMap agent there. The error I got is:\n\n${e}\n`
      );
      await retryConnection();
    }
  }
}
