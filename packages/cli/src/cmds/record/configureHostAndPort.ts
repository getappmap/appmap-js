import { RequestOptions } from 'http';
import UI from '../userInteraction';

export default async function (options: RequestOptions) {
  options.hostname = null;
  options.port = null;

  const { useLocalhost } = await UI.prompt({
    type: 'confirm',
    name: 'useLocalhost',
    message: 'Is your app running on localhost (your machine)?',
    default: 'y',
  });
  if (!useLocalhost) {
    options.hostname = await UI.prompt({
      type: 'input',
      name: 'hostname',
      message: 'Enter the hostname that your server is running on:',
    })['hostname'];
  } else {
    options.hostname = 'localhost';
  }

  while (!options.port) {
    const { portNumber: answer } = await UI.prompt({
      type: 'number',
      name: 'portNumber',
      message: 'Enter the port number on which your server is listening:',
    });
    if (answer) {
      options.port = answer;
    }
  }
}
