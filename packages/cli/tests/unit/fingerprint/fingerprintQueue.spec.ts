import FingerprintQueue from '../../../src/fingerprint/fingerprintQueue';
import sinon from 'sinon';
import { verbose } from '../../../src/utils';

describe(FingerprintQueue, () => {
  beforeEach(() => verbose(process.env.DEBUG === 'true'));
  afterEach(() => {
    sinon.restore();
  });

  it('gracefully handles files which cannot be read', async () => {
    const consoleLog = sinon.stub(console, 'log');

    const queue = new FingerprintQueue();
    queue.push('missing-file.appmap.json');
    await queue.process();

    expect(consoleLog.callCount).toBe(1);
    expect(consoleLog.getCall(0).args[0]).toMatch(/does not exist/);
  });
});
