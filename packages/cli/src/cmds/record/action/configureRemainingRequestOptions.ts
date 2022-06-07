import UI from '../../userInteraction';
import {
  readConfigOption,
  readSetting,
  requestOptions,
  writeConfigOption,
  writeSetting,
} from '../configuration';

export default async function configureRemainingRequestOptions() {
  const defaultPath = await readConfigOption('remote_recording.path', '/');
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

    await writeConfigOption('remote_recording.path', basePath);
  }

  const defaultProtocol = await readConfigOption(
    'remote_recording.protocol',
    'http:'
  );

  const { useSSL } = await UI.prompt({
    type: 'confirm',
    name: 'useSSL',
    message: 'Does your application require SSL / HTTPS?',
    default: defaultProtocol === 'https:',
  });

  const protocol = useSSL ? 'https:' : 'http:';
  if (protocol !== defaultProtocol) {
    await writeConfigOption('remote_recording.protocol', protocol);
  }

  const ro = await requestOptions();
  UI.progress(
    `Here's the URL I will use to try and connect to the AppMap agent:\n`
  );
  UI.progress(
    `${ro.protocol}//${ro.hostname}:${ro.port}${ro.path}_appmap/record`
  );
  UI.progress('');
}
