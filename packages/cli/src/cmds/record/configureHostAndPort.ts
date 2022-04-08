import { RequestOptions } from 'http';
import UI from '../userInteraction';
import { readSetting, writeSetting } from './configuration';

export default async function (options: RequestOptions) {
  const { hostname } = await UI.prompt({
    type: 'input',
    name: 'hostname',
    message: 'Enter the hostname that your server is running on:',
    default: await readSetting('dev_server.host', 'localhost'),
  });

  options.hostname = hostname;
  await writeSetting('dev_server.host', hostname);

  let port: number | undefined;
  while (!port) {
    const { portNumber: answer } = await UI.prompt({
      type: 'input',
      name: 'portNumber',
      message: 'Enter the port number on which your server is listening:',
      default: await readSetting('dev_server.port', 3000),
    });
    port = parseInt(answer);
    if (port !== NaN) {
      await writeSetting('dev_server.port', port);
      options.port = port;
    }
  }
}
