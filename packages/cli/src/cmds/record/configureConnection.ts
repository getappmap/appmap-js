import { RequestOptions } from 'https';
import UI from '../userInteraction';
import { readSetting } from './configuration';
import configureHostAndPort from './configureHostAndPort';
import configureRemainingRequestOptions from './configureRemainingRequestOptions';
import confirmProcessCharacteristics from './confirmProcessCharacteristics';
import RemoteRecording from './remoteRecording';
import serverAvailableAndWaiting from './serverAvailableAndWaiting';
import testConnection from './testConnection';

export default async function configureConnection(
  requestOptions: RequestOptions
) {
  Object.keys(requestOptions).forEach((k) => (requestOptions[k] = null));

  requestOptions.hostname = (
    await readSetting('dev_server.host', '/')
  ).toString();
  requestOptions.port = await readSetting('dev_server.port', 3000);
  requestOptions.path = (await readSetting('dev_server.path', '/')).toString();
  requestOptions.protocol = (
    await readSetting('dev_server.protocol', 'http:')
  ).toString();

  await configureHostAndPort(requestOptions);

  if (await serverAvailableAndWaiting(requestOptions)) {
    return;
  }

  await confirmProcessCharacteristics(requestOptions);
  await configureRemainingRequestOptions(requestOptions);
  await testConnection(requestOptions);
}
