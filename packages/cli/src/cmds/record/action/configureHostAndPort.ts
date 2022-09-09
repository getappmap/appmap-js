import UI from '../../userInteraction';
import RecordContext from '../recordContext';

export default async function configureHostAndPort({
  configuration,
}: RecordContext) {
  const defaultHostname = configuration.setting(
    'remote_recording.host',
    'localhost'
  );
  const { hostname } = await UI.prompt({
    type: 'input',
    name: 'hostname',
    message: 'Enter the hostname that your server is running on:',
    default: defaultHostname,
  });

  if (hostname !== defaultHostname) {
    configuration.setSetting('remote_recording.host', hostname);
  }

  let port: number | undefined;
  const defaultPort = configuration.setting('remote_recording.port', 3000);
  while (!port) {
    const { portNumber: answer } = await UI.prompt({
      type: 'input',
      name: 'portNumber',
      message: 'Enter the port number on which your server is listening:',
      default: defaultPort,
    });
    port = parseInt(answer);
    if (port !== NaN && port !== defaultPort) {
      configuration.setSetting('remote_recording.port', port);
    }
  }

  await configuration.write();
}
