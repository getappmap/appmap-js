import { RequestOptions } from 'https';
import UI from '../userInteraction';
import ready from './ready';

export default async function configureRemainingRequestOptions(
  requestOptions: RequestOptions
) {
  requestOptions.path = (
    await UI.prompt({
      type: 'input',
      name: 'baseURL',
      message: `Enter the base URL of your application. Use this default unless you've mounted your app somewhere other than the root context:`,
      default: '/',
    })
  )['baseURL'];

  const { useSSL } = await UI.prompt({
    type: 'confirm',
    name: 'useSSL',
    message: 'Does your application require SSL?',
    default: false,
  });
  requestOptions.protocol = useSSL ? 'https:' : 'http:';

  UI.progress(`OK. Now I will try and connect to the AppMap recording agent.`);
  UI.progress(`Here's the URL I will use:\n`);
  UI.progress(
    `${requestOptions.protocol}//${requestOptions.hostname}:${requestOptions.port}/${requestOptions.path}_appmap/record`
  );
  UI.progress('');

  await ready();
}
