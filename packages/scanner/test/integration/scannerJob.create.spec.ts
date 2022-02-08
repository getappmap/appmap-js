// import nock from 'nock';

import * as test from './setup';
import { create } from '../../src/integration/appland/scannerJob/create';
import { chdir, cwd } from 'process';
import nock from 'nock';
import { readFileSync } from 'fs';
import { join } from 'path';

const dir = cwd();

const FixtureDir = 'test/fixtures/scanResults';
const ScanResults = JSON.parse(readFileSync(join(FixtureDir, 'scanResults.json')).toString());
const AppMapData1 = { uuid: '5123211e-66e1-4184-b5a9-32976a6ebc85' };
const AppMapData2 = { uuid: '1d10c86f-02ec-4f60-ac46-94282c87f0f1' };
const MapsetData = {
  id: 135,
  created_at: '2022-02-08T14:15:47.435Z',
  updated_at: '2022-02-08T14:15:47.435Z',
  user_id: 35,
  app_id: 35,
};
const ScannerJobData = {
  id: 112,
  mapset_id: 135,
  created_at: '2022-02-08T14:15:47.580Z',
  updated_at: '2022-02-08T14:15:47.580Z',
  summary: ScanResults.summary,
  configuration: ScanResults.configuration,
};

describe('scannerJob', () => {
  beforeEach(() => chdir(FixtureDir));

  afterEach(() => chdir(dir));

  describe('create', () => {
    it('succeeds', async () => {
      [AppMapData1, AppMapData2].forEach((appMapData) => {
        nock('http://localhost:3000')
          .post(`/api/appmaps`, /Content-Disposition: form-data/)
          .matchHeader(
            'Authorization',
            'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
          )
          .matchHeader('Content-Type', /^multipart\/form-data; boundary/)
          .matchHeader('Accept', /^application\/json;?/)
          .reply(201, appMapData, ['Content-Type', 'application/json']);
      });

      nock('http://localhost:3000', { encodedQueryParams: true })
        .post('/api/mapsets', {
          app: test.AppId,
          appmaps: [AppMapData1.uuid, AppMapData2.uuid],
        })
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .reply(201, MapsetData);

      nock('http://localhost:3000', { encodedQueryParams: true })
        .post('/api/scanner_jobs')
        .matchHeader(
          'Authorization',
          'Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5'
        )
        .reply(201, ScannerJobData, {
          location: `http://localhost:3000/scanner_jobs/${ScannerJobData.id}`,
        });

      const uploadResponse = await create(ScanResults, test.AppId);
      expect(Object.keys(uploadResponse)).toEqual([
        'id',
        'mapset_id',
        'created_at',
        'updated_at',
        'summary',
        'configuration',
        'url',
      ]);
      expect(uploadResponse.url.toString()).toEqual(
        `http://localhost:3000/scanner_jobs/${uploadResponse.id}`
      );
      expect(uploadResponse.summary).toEqual({
        numChecks: 1000,
        appMapMetadata: {
          git: [
            {
              branch: 'main',
              commit: 'd7fb6ffb8e296915c85b24339b33645b5c8f927c',
            },
          ],
        },
      });
      expect(uploadResponse.configuration).toEqual({
        arbitraryKey: 'arbitraryValue',
      });
    });
  });
});
