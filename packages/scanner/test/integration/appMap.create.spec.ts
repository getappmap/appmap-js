import nock from 'nock';

import * as test from './setup';
import { create, CreateOptions } from '../../src/integration/appland/appMap/create';

const AppMapData = {
  uuid: 'the-uuid',
};

describe('appMap', () => {
  describe('create', () => {
    it('succeeds', async () => {
      const data = Buffer.from(JSON.stringify({}));
      const options = {
        app: test.AppId,
      } as CreateOptions;

      nock('http://localhost:3000')
        .post(`/api/appmaps`, /Content-Disposition: form-data/)
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .matchHeader('Content-Type', /^multipart\/form-data; boundary/)
        .matchHeader('Accept', /^application\/json;?/)
        .reply(201, AppMapData, ['Content-Type', 'application/json']);
      expect(await create(data, options)).toEqual(AppMapData);
    });
  });
});
