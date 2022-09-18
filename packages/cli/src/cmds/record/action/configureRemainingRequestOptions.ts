import UI from '../../userInteraction';
import RecordContext from '../recordContext';

export default async function configureRemainingRequestOptions({ configuration }: RecordContext) {
  const defaultPath = configuration.configOption('remote_recording.path', '/');
  const { baseURL: path } = await UI.prompt({
    type: 'input',
    name: 'baseURL',
    message: `Enter the base URL of your application:`,
    default: defaultPath,
  });

  if (path !== defaultPath) {
    let basePath = path;
    if (!basePath.endsWith('/')) basePath = [basePath, '/'].join('');
    if (!basePath.startsWith('/')) basePath = ['/', basePath].join('');

    configuration.setConfigOption('remote_recording.path', basePath);
  }

  const defaultProtocol = configuration.configOption('remote_recording.protocol', 'http:');

  const { useSSL } = await UI.prompt({
    type: 'confirm',
    name: 'useSSL',
    message: 'Does your application require SSL / HTTPS?',
    default: defaultProtocol === 'https:',
  });

  const protocol = useSSL ? 'https:' : 'http:';
  if (protocol !== defaultProtocol) {
    configuration.setConfigOption('remote_recording.protocol', protocol);
  }
  await configuration.write();

  const ro = configuration.requestOptions();
  UI.progress(`Here's the URL I will use to try and connect to the AppMap agent:\n`);
  UI.progress(`${ro.protocol}//${ro.hostname}:${ro.port}${ro.path}_appmap/record`);
  UI.progress('');
}
