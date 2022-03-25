import nock from 'nock';
import { verbose } from '../../src/rules/lib/util';

if (process.env.RECORD) {
  nock.recorder.rec();
  beforeAll(
    () =>
      (process.env.APPLAND_API_KEY ||=
        'a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5')
  );
  beforeAll(() => (process.env.APPLAND_URL ||= 'http://localhost:3000'));
} else {
  beforeEach(
    () =>
      (process.env.APPLAND_API_KEY =
        'a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5')
  );
  beforeEach(() => (process.env.APPLAND_URL = 'http://localhost:3000'));
  afterEach(() => delete process.env.APPLAND_API_KEY);
  afterEach(() => delete process.env.APPLAND_URL);
}

if (process.env.DEBUG) {
  verbose(true);
}

export const OrgId = process.env.RECORD ? process.env.APPMAP_ORG : 'myorg';
export const AppId = [OrgId, 'sample_app_6th_ed'].join('/');
export const AppIdNotFound = 'myorg/foobar';
export const AppIdErr = 'myorg/err';
export const AppMapId = '153ec835-1edc-4485-b4b8-65fd411197e9';
export const MapsetId = 60;
