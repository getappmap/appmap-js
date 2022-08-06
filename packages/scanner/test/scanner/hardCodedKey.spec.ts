import Check from '../../src/check';
import { loadRule } from '../../src/configuration/configurationProvider';
import { scan } from '../util';

describe('hard-coded key', () => {
  it('found', async () => {
    const rule = await loadRule('hard-coded-key');
    const { findings } = await scan(
      new Check(rule),
      './ruby/fixture/tmp/appmap/minitest/Crypt_hard_coded_key.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding1 = findings[0];
    expect(finding1.ruleId).toEqual('hard-coded-key');
    expect(finding1.event.id).toEqual(4);
    expect(finding1.message).toEqual(
      `Cryptographic key is not obtained from a function, and may be hard-coded`
    );
    expect(finding1.relatedEvents).toHaveLength(2);
  });
  it('not found', async () => {
    const rule = await loadRule('hard-coded-key');
    const { findings } = await scan(
      new Check(rule),
      './ruby/fixture/tmp/appmap/minitest/Crypt_random_key.appmap.json'
    );
    expect(findings).toHaveLength(0);
  });
});
