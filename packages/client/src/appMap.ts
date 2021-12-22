import { AppMap } from '@appland/models';
import reportJSON from './reportJson';
import get from './get';

/**
 * Loads AppMap data from UUID.
 */
export default class {
  constructor(public uuid: string) {}

  async get(): Promise<AppMap> {
    const requestPath = ['api/appmaps', this.uuid].join('/');
    return get(requestPath).then((response) => reportJSON<AppMap>(response));
  }
}
