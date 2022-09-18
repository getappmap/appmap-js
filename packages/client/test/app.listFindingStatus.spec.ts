import nock from 'nock';

import * as test from './setup';
import App from '../src/app';
import FindingStatusListItem from '../src/findingStatusListItem';

const StatusData = [
  {
    app_id: 35,
    identity_hash: 'cd17019c105fcbe54446e68c6185625dee8c565d98e1b8444693e2e14b369609',
    status: 'deferred',
  },
  {
    app_id: 35,
    identity_hash: '0e9e40b01a5e6f743f8a4b647b24e861224e87c555acf6a78893023d222d2f41',
    status: 'new',
  },
];

function mockFindingStatus(app = test.AppId): nock.Interceptor {
  return nock('http://localhost:3000').get(`/api/${app}/finding_status`);
}

async function listFindingStatus(app = test.AppId): Promise<FindingStatusListItem[]> {
  return new App(app).listFindingStatus();
}

describe('app', () => {
  describe('listFindingStatus', () => {
    describe('when avaliable', () => {
      it('is provided', async () => {
        mockFindingStatus()
          .matchHeader(
            'Authorization',
            'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
          )
          .matchHeader('Accept', 'application/json')
          .reply(200, StatusData, ['Content-Type', 'application/json']);
        expect(await listFindingStatus()).toEqual(StatusData);
      });
    });
    describe('not found', () => {
      it('reports the structured error', async () => {
        mockFindingStatus(test.AppIdNotFound).reply(404, { error: { message: 'App not found' } }, [
          'Content-Type',
          'application/json',
        ]);
        listFindingStatus(test.AppIdNotFound).catch((err) => {
          expect(err.toString()).toEqual('HTTP 404: App not found');
        });
      });
    });
    describe('internal server error', () => {
      it('responds with a generic error', async () => {
        mockFindingStatus(test.AppIdErr).reply(500, '', ['Content-Type', 'text/html']);
        listFindingStatus(test.AppIdErr).catch((err) => {
          expect(err.toString()).toEqual('HTTP 500');
        });
      });
    });
  });
});
