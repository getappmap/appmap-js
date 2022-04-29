import Check from '../../src/check';
import rule from '../../src/rules/deserializationOfUntrustedData';
import { scan } from '../util';

test('unsafe deserialization', async () => {
  const check = new Check(rule);
  const findings = await scan(
    check,
    'appmaps/deserializationOfUntrustedData/Users_index_index_as_non-admin.appmap.json'
  );
  expect(findings).toHaveLength(1);
  expect(findings[0].event.codeObject.fqid).toEqual(
    'function:marshal/ActiveSupport::MarshalWithAutoloading.load'
  );
});
