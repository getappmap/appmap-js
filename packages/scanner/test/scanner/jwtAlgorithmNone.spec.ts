import Check from '../../src/check';
import rule from '../../src/rules/jwtAlgorithmNone';
import { scan } from '../util';

describe('JWT Unverified Signature', () => {
  const check = new Check(rule);

  it('identifies cases where a JWT is encoded and the algorithm is none', async () => {
    const { findings } = await scan(check, 'JWT.encode_alg_none.appmap.json');
    expect(findings).toHaveLength(1);
    expect(findings.map((f) => f.event.id)).toEqual([1]);

    const [finding] = findings;
    expect(finding.ruleId).toEqual(rule.id);
  });

  it('does not match cases where a JWT is encoded with a valid algorithm', async () => {
    const appMaps = ['JWT.encode_signature.appmap.json', 'JWT.encode_no_signature.appmap.json'];
    for (const appMap of appMaps) {
      const { findings } = await scan(check, appMap);
      expect(findings).toHaveLength(0);
    }
  });
});
