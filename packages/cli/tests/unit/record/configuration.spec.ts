import TempConfig from './tempConfig';

describe('configuration', () => {
  let config = new TempConfig();

  beforeEach(() => (config = new TempConfig()).initialize());

  describe('requestOptions', () => {
    it('returns default config', async () => {
      const options = config.requestOptions();
      expect(options).toEqual({
        hostname: 'localhost',
        path: '/',
        port: 3000,
        protocol: 'http:',
      });
    });
    describe('with non-default config', () => {
      it('returns modified request options', async () => {
        config.setConfigOption('remote_recording.path', '/myapp');
        await config.write();
        await config.read();
        const options = config.requestOptions();
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
        config.setSetting('remote_recording.host', 'myhost');
        await config.write();
        await config.read();
        const options = config.requestOptions();
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
