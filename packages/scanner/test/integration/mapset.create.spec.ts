import nock from 'nock';

import * as test from './setup';
import { CreateOptions, CreateResponse, Mapset } from '../../src/integration/appland/mapset';
import { AppMap } from '../../src/integration/appland/appMap';
import { readFile } from 'fs/promises';

const MapsetData = {
  id: 94,
  created_at: '2022-01-30T22:05:26.330Z',
  updated_at: '2022-01-30T22:05:26.330Z',
  user_id: 35,
  app_id: 35,
} as CreateResponse;

describe('mapset', () => {
  describe('post', () => {
    it('is created', async () => {
      let appMapId;
      if (process.env.RECORD == 'true') {
        const data = await readFile(
          'test/fixtures/appmaps/Microposts_interface_micropost_interface_with_job.appmap.json'
        );
        const appMap = await AppMap.upload(data, {
          app: test.AppId,
        });
        appMapId = appMap.uuid;
      } else {
        appMapId = 'the-uuid';
      }
      const options = {} as CreateOptions;

      const postData = {
        app: test.AppId,
        appmaps: [appMapId],
      };

      nock('http://localhost:3000')
        .post(`/api/mapsets`, postData)
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .matchHeader('Content-Type', /^application\/json;?/)
        .matchHeader('Accept', /^application\/json;?/)
        .reply(201, MapsetData, ['Content-Type', 'application/json']);
      expect(await Mapset.create(test.AppId, [appMapId], options)).toEqual(MapsetData);
    });
  });
});
