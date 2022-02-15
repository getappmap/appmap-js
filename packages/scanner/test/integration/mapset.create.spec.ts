import nock from 'nock';

import * as test from './setup';
import {
  CreateOptions,
  CreateResponse,
  create as createMapset,
} from '../../src/integration/appland/mapset/create';
import { create as createAppMap } from '../../src/integration/appland/appMap/create';
import { readFile } from 'fs/promises';

const MapsetData = {
  id: 94,
  created_at: '2022-01-30T22:05:26.330Z',
  updated_at: '2022-01-30T22:05:26.330Z',
  user_id: 35,
  app_id: 35,
} as CreateResponse;

describe('mapset', () => {
  describe('create', () => {
    it('succeeds', async () => {
      let appMapId;
      if (process.env.RECORD == 'true') {
        const data = await readFile(
          'test/fixtures/appmaps/Microposts_interface_micropost_interface_with_job.appmap.json'
        );
        const appMap = await createAppMap(data, {
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
      expect(await createMapset(test.AppId, [appMapId], options)).toEqual(MapsetData);
    });

    it('succeeds on retry', async () => {
      const postData = {
        app: test.AppId,
        appmaps: ['the-uuid'],
      };

      nock('http://localhost:3000')
        .post(`/api/mapsets`, postData)
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .matchHeader('Content-Type', /^application\/json;?/)
        .matchHeader('Accept', /^application\/json;?/)
        .reply(503);

      nock('http://localhost:3000')
        .post(`/api/mapsets`, postData)
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .matchHeader('Content-Type', /^application\/json;?/)
        .matchHeader('Accept', /^application\/json;?/)
        .reply(201, MapsetData, ['Content-Type', 'application/json']);

      expect(await createMapset(test.AppId, ['the-uuid'], {}, { maxRetries: 1 })).toEqual(
        MapsetData
      );
    });
  });
});
