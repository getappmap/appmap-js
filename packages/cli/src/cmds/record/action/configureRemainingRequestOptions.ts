import UI from '../../userInteraction';
import { readSetting, requestOptions, writeSetting } from '../configuration';
import ready from '../prompt/ready';

export default async function configureRemainingRequestOptions() {
  const ro = await requestOptions();

  ro.path = (
    await UI.prompt({
      type: 'input',
      name: 'baseURL',
      message: `Enter the base URL of your application:`,
      default: await readSetting('dev_server.path', '/'),
    })
  )['baseURL'];

  if (ro.path) await writeSetting('dev_server.path', ro.path);

  const { useSSL } = await UI.prompt({
    type: 'confirm',
    name: 'useSSL',
    message: 'Does your application require SSL / HTTPS?',
    default: (await readSetting('dev_server.protocol', 'http:')) === 'https:',
  });
  ro.protocol = useSSL ? 'https:' : 'http:';

  await writeSetting('dev_server.protocol', ro.protocol);

  UI.progress(
    `Here's the URL I will use to try and connect to the AppMap agent:\n`
  );
  UI.progress(
    `${ro.protocol}//${ro.hostname}:${ro.port}${ro.path}_appmap/record`
  );
  UI.progress('');

  await ready();
}
