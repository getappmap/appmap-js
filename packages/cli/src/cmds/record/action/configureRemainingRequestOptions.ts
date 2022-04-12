import UI from '../../userInteraction';
import {
  readConfigOption,
  readSetting,
  requestOptions,
  writeConfigOption,
  writeSetting,
} from '../configuration';

export default async function configureRemainingRequestOptions() {
  const defaultPath = await readConfigOption('dev_server.path', '/');
  const { baseURL: path } = await UI.prompt({
    type: 'input',
    name: 'baseURL',
    message: `Enter the base URL of your application:`,
    default: defaultPath,
  });

  if (path !== defaultPath) {
    await writeConfigOption('dev_server.path', path);
  }

  const defaultProtocol = await readConfigOption(
    'dev_server.protocol',
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
    await writeConfigOption('dev_server.protocol', protocol);
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
