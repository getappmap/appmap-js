import Check from '../../src/check';
import { loadRule } from '../../src/configuration/configurationProvider';
import { scan } from '../util';

describe('unauthenticated encryption', () => {
  it('found', async () => {
    const rule = await loadRule('unauthenticated-encryption');
    const { findings } = await scan(
      new Check(rule),
      './ruby/fixture/tmp/appmap/minitest/Crypt_crypt_aes_128_cbc.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding1 = findings[0];
    expect(finding1.ruleId).toEqual('unauthenticated-encryption');
    expect(finding1.event.id).toEqual(2);
    expect(finding1.message).toEqual(`Encryption is not authenticated`);
    expect(finding1.relatedEvents).toHaveLength(1);
  });
  it('not found', async () => {
    const rule = await loadRule('unauthenticated-encryption');
    const { findings } = await scan(
      new Check(rule),
      './ruby/fixture/tmp/appmap/minitest/Crypt_crypt_aes_256_gcm.appmap.json'
    );
    expect(findings).toHaveLength(0);
  });
});
