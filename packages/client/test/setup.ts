import nock from 'nock';

if (process.env.RECORD) {
  nock.recorder.rec();
}

export const OrgId = process.env.RECORD ? process.env.APPMAP_ORG : 'myorg';
export const AppId = [OrgId, 'sample_app_6th_ed'].join('/');
export const AppIdNotFound = 'myorg/foobar';
export const AppIdErr = 'myorg/err';

export const AppMapId = '153ec835-1edc-4485-b4b8-65fd411197e9';

export const MapsetId = 60;