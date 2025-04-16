import FingerprintQueue from '../../../src/fingerprint/fingerprintQueue';
import { verbose } from '../../../src/utils';

describe(FingerprintQueue, () => {
  beforeEach(() => verbose(process.env.DEBUG === 'true'));

  it('gracefully handles files which cannot be read', async () => {
    const logSpy = jest.spyOn(console, 'warn');

    const queue = new FingerprintQueue();
    queue.push('missing-file.appmap.json');
    await queue.process();

    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.mock.calls[0][0]).toMatch(/does not exist/);
  });
});
