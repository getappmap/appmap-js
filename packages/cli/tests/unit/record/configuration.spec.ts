import * as configuration from '../../../src/cmds/record/configuration';
import TempConfig from './tempConfig';

describe('configuration', () => {
  let config: TempConfig;

  beforeEach(() => (config = new TempConfig()));
  beforeEach(() => config.initialize());

  afterEach(() => config.cleanup());

  describe('requestOptions', () => {
    it('returns default config', async () => {
      const options = await configuration.requestOptions();
      expect(options).toEqual({
        hostname: 'localhost',
        path: '/',
        port: 3000,
        protocol: 'http:',
      });
    });
    describe('with non-default config', () => {
      it('returns modified request options', async () => {
        await configuration.writeConfigOption(
          'remote_recording.path',
          '/myapp'
        );
        const options = await configuration.requestOptions();
        expect(options).toEqual({
          hostname: 'localhost',
          path: '/myapp',
          port: 3000,
          protocol: 'http:',
        });
      });
    });
    describe('with non-default setting', () => {
      it('returns modified request options', async () => {
        await configuration.writeSetting('remote_recording.host', 'myhost');
        const options = await configuration.requestOptions();
        expect(options).toEqual({
          hostname: 'myhost',
          path: '/',
          port: 3000,
          protocol: 'http:',
        });
      });
    });
  });
});
