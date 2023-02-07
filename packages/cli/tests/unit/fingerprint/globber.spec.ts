import { createFsFromVolume, Volume } from 'memfs';
import path from 'path';
import Globber from '../../../src/fingerprint/globber';

describe('Globber', () => {
  const appMapDir = path.join('/tmp', 'appmap');
  const appMap = 'foo.appmap.json';
  const appMapPath = path.join(appMapDir, appMap);

  let fs;
  let globber: Globber;

  beforeEach(() => {
    const vol = new Volume();
    vol.mkdirSync(appMapDir, { recursive: true });
    fs = createFsFromVolume(vol);
    globber = new Globber('/**/*.appmap.json', { fs });
  });

  it('emits add events', (done) => {
    expect.assertions(1);
    globber.on('add', (actual) => {
      expect(path.basename(actual)).toStrictEqual(appMap);
      done();
    });

    fs.writeFileSync(appMapPath, '{"hello": "world"}');
    globber.scanNow();
  });

  it('emits change events', (done) => {
    expect.assertions(1);
    globber.on('add', () => {
      fs.writeFileSync(appMapPath, '{"hello": "again"}');
      globber.scanNow();
    });
    globber.on('change', (actual) => {
      expect(path.basename(actual)).toStrictEqual(appMap);
      done();
    });

    fs.writeFileSync(appMapPath, '{"hello": "world"}');
    globber.scanNow();
  });

  it('emits unlink events', (done) => {
    expect.assertions(1);
    globber.on('add', () => {
      fs.unlinkSync(appMapPath);
      globber.scanNow();
    });
    globber.on('unlink', (actual) => {
      expect(path.basename(actual)).toStrictEqual(appMap);
      done();
    });

    fs.writeFileSync(appMapPath, '{"hello": "world"}');
    globber.scanNow();
  });

  it('emits end events', (done) => {
    expect.assertions(1);

    globber.on('end', () => {
      expect(true).toBeTruthy();
      done();
    });

    globber.scanNow();
  });
});
