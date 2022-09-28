import nock from 'nock';
import { AppMap as AppMapDataType } from '@appland/models';

import * as test from './setup';
import { default as AppMapClient } from '../src/appMap';

const AppMapData = {
  events: [],
  metadata: {},
  classMap: [],
};

function mockAppMap(uuid = test.AppMapId): nock.Interceptor {
  return nock('http://localhost:3000').get(`/api/appmaps/${uuid}`);
}

async function getAppMap(appMapId = test.AppMapId): Promise<AppMapDataType> {
  return new AppMapClient(appMapId).get();
}

describe('appMap', () => {
  describe('get', () => {
    describe('when avaliable', () => {
      it('is provided', async () => {
        mockAppMap()
          .matchHeader(
            'Authorization',
            'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
          )
          .matchHeader('Accept', 'application/json')
          .reply(200, AppMapData, ['Content-Type', 'application/json']);
        expect(await getAppMap()).toEqual(AppMapData);
      });
    });
  });
});
