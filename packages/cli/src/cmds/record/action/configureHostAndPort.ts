import UI from '../../userInteraction';
import { readSetting, writeSetting } from '../configuration';

export default async function configureHostAndPort() {
  const defaultHostname = await readSetting('dev_server.host', 'localhost');
  const { hostname } = await UI.prompt({
    type: 'input',
    name: 'hostname',
    message: 'Enter the hostname that your server is running on:',
    default: defaultHostname,
  });

  if (hostname !== defaultHostname) {
    await writeSetting('dev_server.host', hostname);
  }

  let port: number | undefined;
  const defaultPort = await readSetting('dev_server.port', 3000);
  while (!port) {
    const { portNumber: answer } = await UI.prompt({
      type: 'input',
      name: 'portNumber',
      message: 'Enter the port number on which your server is listening:',
      default: defaultPort,
    });
    port = parseInt(answer);
    if (port !== NaN && port !== defaultPort) {
      await writeSetting('dev_server.port', port);
    }
  }
}
