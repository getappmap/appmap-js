import nock from 'nock';

import * as test from './setup';
import { App, AppMapListItem } from '../src';

const AppMapListItems = [
  {
    id: 60,
    created_at: '2021-12-22T17:15:01.779Z',
    branch: ' ',
    commit: 'c5bec8ce96edbc3f1bfa0ccdb5e6ad97bee217a6',
    user: 'kevin',
  },
  {
    id: 59,
    created_at: '2021-12-22T17:14:16.175Z',
    branch: ' ',
    commit: 'cc09bfaeb79cd8442462305a168e40c0038218c1',
    user: 'kevin',
  },
];

function mockAppMaps(
  appId = test.AppId,
  mapset = test.MapsetId
): nock.Interceptor {
  return nock('http://localhost:3000').get(
    `/api/mapsets?app=${appId}&mapset=${mapset}`
  );
}

async function getAppMaps(
  appId = test.AppId,
  mapsetId = test.MapsetId
): Promise<AppMapListItem[]> {
  return new App(appId).mapset(mapsetId).listAppMaps();
}

describe('mapset', () => {
  describe('listAppMaps', () => {
    describe('when avaliable', () => {
      it('is provided', async () => {
        mockAppMaps()
          .matchHeader(
            'Authorization',
            'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
          )
          .matchHeader('Accept', 'application/json')
          .reply(200, AppMapListItems, ['Content-Type', 'application/json']);
        expect(await getAppMaps()).toEqual(AppMapListItems);
      });
    });
  });
});
