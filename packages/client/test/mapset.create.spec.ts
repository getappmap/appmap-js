import nock from 'nock';

import * as test from './setup';
import {
  CreateMapsetOptions,
  CreateMapsetResponse,
  Mapset,
} from '../src';

const MapsetData = {
  id: 94,
  created_at: '2022-01-30T22:05:26.330Z',
  updated_at: '2022-01-30T22:05:26.330Z',
  user_id: 35,
  app_id: 35,
} as CreateMapsetResponse;

describe('mapset', () => {
  describe('create', () => {
    it('succeeds', async () => {
      const appMapId = 'the-uuid';
      const options = {} as CreateMapsetOptions;

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

      expect(await Mapset.create(test.AppId, ['the-uuid'], {}, { maxRetries: 1 })).toEqual(
        MapsetData
      );
    });
  });
});
