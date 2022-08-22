import FingerprintQueue from '../../../src/fingerprint/fingerprintQueue';
import sinon, { SinonStub } from 'sinon';
import { verbose } from '../../../src/utils';

describe(FingerprintQueue, () => {
  beforeEach(() => verbose(process.env.DEBUG === 'true'));
  afterEach(() => {
    sinon.restore();
  });

  it('gracefully handles files which cannot be read', async () => {
    const queue = new FingerprintQueue();
    queue.push('missing-file.appmap.json');
    await queue.process();

    expect((console.log as SinonStub).callCount).toBe(1);
    expect((console.log as SinonStub).getCall(0).args[0]).toMatch(
      /does not exist/
    );
  });
});
