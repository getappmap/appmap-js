import * as test from '../integration/setup';
import Command from '../../src/cli/upload/command';
import nock from 'nock';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as vars from '../../src/integration/vars';
import * as mapsets from '../../src/integration/appland/mapset/create';
import * as scannerJobs from '../../src/integration/appland/scannerJob/create';
import upload from '../../src/cli/upload';
import sinon from 'sinon';

import CommandOptions from '../../src/cli/upload/options';

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

const StandardOptions = {
  verbose: true,
  app: test.AppId,
  appmapDir: FixtureDir,
  reportFile: join(FixtureDir, 'scanResults.json'),
} as CommandOptions;

describe('upload', () => {
  it('runs with default arguments', async () => {
    const localhost = nock('http://localhost:3000');
    localhost.head(`/api/${test.AppId}`).reply(204).persist();
    localhost.post(`/api/appmaps`).reply(201, AppMapData1, ['Content-Type', 'application/json']);
    localhost.post(`/api/appmaps`).reply(201, AppMapData2, ['Content-Type', 'application/json']);
    localhost.post(`/api/mapsets`).reply(201, MapsetData, ['Content-Type', 'application/json']);
    localhost.post(`/api/scanner_jobs`).reply(201, ScannerJobData, {
      location: `http://localhost:3000/scanner_jobs/${ScannerJobData.id}`,
    });

    await Command.handler(StandardOptions as any);
  });

  it('accepts branch and environment', async () => {
    const localhost = nock('http://localhost:3000');
    localhost.head(`/api/${test.AppId}`).reply(204).persist();
    localhost.post(`/api/appmaps`).reply(201, AppMapData1, ['Content-Type', 'application/json']);
    localhost.post(`/api/appmaps`).reply(201, AppMapData2, ['Content-Type', 'application/json']);
    localhost
      .post(`/api/mapsets`, {
        app: test.AppId,
        appmaps: [AppMapData1.uuid, AppMapData2.uuid],
        branch: 'feat/my-branch',
        commit: '1234567890',
        environment: 'ci',
      })
      .reply(201, MapsetData, ['Content-Type', 'application/json']);
    localhost.post(`/api/scanner_jobs`).reply(201, ScannerJobData, {
      location: `http://localhost:3000/scanner_jobs/${ScannerJobData.id}`,
    });

    await Command.handler(
      Object.assign({}, StandardOptions, {
        branch: 'feat/my-branch',
        commit: '1234567890',
        environment: 'ci',
      }) as any
    );
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

    await upload(ScanResults, appId, FixtureDir);

    expect(mapsetsCreate.calledOnce).toBe(true);
    expect(mapsetsCreate.getCall(0).args[2]).toMatchObject({
      branch: expectedBranch,
      commit: expectedCommit,
    });

    sinon.restore();
  });
});
