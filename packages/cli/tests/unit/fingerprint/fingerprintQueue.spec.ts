import FingerprintQueue from '../../../src/fingerprint/fingerprintQueue';
import sinon from 'sinon';

describe(FingerprintQueue, () => {
  afterEach(() => {
    sinon.restore();
  });

  it('gracefully handles files which cannot be read', async () => {
    const logWarn = sinon.stub(console, 'warn');

    const queue = new FingerprintQueue();
    queue.push('missing-file.appmap.json');
    await queue.process();

    expect(logWarn.callCount).toBe(1);
    expect(logWarn.getCall(0).args[0]).toMatch(/The file does not exist/);
  });
});
