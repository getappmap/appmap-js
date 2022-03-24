import * as test from '../integration/setup';
import { create } from '../../src/integration/appland/scannerJob/create';
import { chdir, cwd } from 'process';
import nock from 'nock';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as vars from '../../src/integration/vars';
import * as mapsets from '../../src/integration/appland/mapset/create';
import * as scannerJobs from '../../src/integration/appland/scannerJob/create';
import upload from '../../src/cli/upload';
import sinon from 'sinon';

const dir = cwd();

const FixtureDir = 'test/fixtures/scanResults';
const ScanResults = JSON.parse(readFileSync(join(FixtureDir, 'scanResults.json')).toString());
const AppMapData1 = { uuid: '5123211e-66e1-4184-b5a9-32976a6ebc85' };
const AppMapData2 = { uuid: '1d10c86f-02ec-4f60-ac46-94282c87f0f1' };
const AppMapUUIDByFileName = {
  'Misago/tmp/appmap/pytest/test_activating_multiple_users_sends_email_notifications_to_them.appmap.json':
    AppMapData1.uuid,
  'Misago/tmp/appmap/pytest/test_active_theme_styles_are_included_in_page_html.appmap.json':
    AppMapData2.uuid,
};
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

describe('upload', () => {
  beforeEach(() => chdir(FixtureDir));

  afterEach(() => chdir(dir));

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

    const uploadResponse = await create(
      ScanResults,
      MapsetData.id,
      AppMapUUIDByFileName,
      {},
      {
        maxRetries: 1,
      }
    );
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

  it('resolves commit and branch information from the environment', async () => {
    const expectedBranch = 'feat/new-feature';
    const expectedCommit = 'f71f84edf28e5f5cbf7649efc95773cbc5a73db7';
    sinon.stub(vars, 'branch').returns(expectedBranch);
    sinon.stub(vars, 'sha').returns(expectedCommit);
    sinon.stub(scannerJobs, 'create');
    const appId = MapsetData.app_id.toString();
    const mapsetsCreate = sinon
      .stub(mapsets, 'create')
      .resolves({ id: 1 } as mapsets.CreateResponse);

    await upload(ScanResults, appId);

    expect(mapsetsCreate.calledOnce).toBe(true);
    expect(mapsetsCreate.getCall(0).args[2]).toMatchObject({
      branch: expectedBranch,
      commit: expectedCommit,
    });

    sinon.restore();
  });
});
