import { RequestOptions } from 'https';
import { verbose } from '../../utils';
import UI from '../userInteraction';
import { readSetting, writeSetting } from './configuration';
import ready from './ready';
import RemoteRecording from './remoteRecording';

export default async function configureRemainingRequestOptions(
  requestOptions: RequestOptions
) {
  let defaultOptionsOK: boolean | undefined;
  try {
    await new RemoteRecording(requestOptions).status();
    defaultOptionsOK = true;
  } catch (e) {
    // OK, we will customize the base URL and SSL
    if (verbose()) console.warn(e);
    defaultOptionsOK = false;
  }

  if (defaultOptionsOK) {
    await writeSetting('dev_server.path', '/');
    await writeSetting('dev_server.protocol', 'http:');
    return;
  }

  requestOptions.path = (
    await UI.prompt({
      type: 'input',
      name: 'baseURL',
      message: `Enter the base URL of your application. Use this default unless you've mounted your app somewhere other than the root context:`,
      default: await readSetting('dev_server.url', '/'),
    })
  )['baseURL'];

  if (requestOptions.path)
    await writeSetting('dev_server.url', requestOptions.path);

  const { useSSL } = await UI.prompt({
    type: 'confirm',
    name: 'useSSL',
    message: 'Does your application require SSL?',
    default: (await readSetting('dev_server.protocol', 'http:')) === 'https:',
  });
  requestOptions.protocol = useSSL ? 'https:' : 'http:';

  await writeSetting('dev_server.protocol', requestOptions.protocol);

  UI.progress(
    `Here's the URL I will use to try and connect to the AppMap agent:\n`
  );
  UI.progress(
    `${requestOptions.protocol}//${requestOptions.hostname}:${requestOptions.port}${requestOptions.path}_appmap/record`
  );
  UI.progress('');

  await ready();
}
