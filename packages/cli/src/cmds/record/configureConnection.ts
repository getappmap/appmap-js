import { RequestOptions } from 'https';
import configureHostAndPort from './configureHostAndPort';
import configureRemainingRequestOptions from './configureRemainingRequestOptions';
import confirmProcessCharacteristics from './confirmProcessCharacteristics';

export default async function configureConnection(
  requestOptions: RequestOptions
) {
  Object.keys(requestOptions).forEach((k) => (requestOptions[k] = null));

  await configureHostAndPort(requestOptions);
  await confirmProcessCharacteristics(requestOptions);
  await configureRemainingRequestOptions(requestOptions);
}
