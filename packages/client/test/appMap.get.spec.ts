import AppMap from '../src/appMap';
import { queueTest } from './vcr';

describe('appMap', () => {
  describe('get', () => {
    it(
      'is provided',
      queueTest(async function () {
        const appMap = await new AppMap(
          '153ec835-1edc-4485-b4b8-65fd411197e9'
        ).get();
        expect(Object.keys(appMap).sort()).toEqual([
          'classMap',
          'events',
          'metadata',
          'version',
        ]);
      })
    );
  });
});
