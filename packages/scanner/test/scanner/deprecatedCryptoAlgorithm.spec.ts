import Check from '../../src/check';
import { loadRule } from '../../src/configuration/configurationProvider';
import { scan } from '../util';

it('deprecated crypto algorithm', async () => {
  const rule = await loadRule('deprecated-crypto-algorithm');
  const { findings } = await scan(
    new Check(rule),
    './ruby/fixture/tmp/appmap/minitest/Crypt_crypt_aes_128_cbc.appmap.json'
  );
  expect(findings).toHaveLength(1);
  const finding1 = findings[0];
  expect(finding1.ruleId).toEqual('deprecated-crypto-algorithm');
  expect(finding1.event.id).toEqual(2);
  expect(finding1.message).toEqual(`Deprecated crypto algorithm: AES-128-CBC`);
  expect(finding1.relatedEvents).toHaveLength(1);
});
