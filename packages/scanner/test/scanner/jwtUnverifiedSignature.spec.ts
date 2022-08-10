import Check from '../../src/check';
import rule from '../../src/rules/jwtUnverifiedSignature';
import { scan } from '../util';

describe('JWT Unverified Signature', () => {
  const check = new Check(rule);

  it('identifies cases where a JWT is decoded and the signature is not verified', async () => {
    const { findings } = await scan(check, 'JWT.decode_no_validation.appmap.json');
    expect(findings).toHaveLength(1);
    expect(findings.map((f) => f.event.id)).toEqual([1]);

    const [finding] = findings;
    expect(finding.ruleId).toEqual(rule.id);
  });

  it('does not match cases where a JWT is decoded and the signature is verified', async () => {
    const { findings } = await scan(check, 'JWT.decode_validation.appmap.json');
    expect(findings).toHaveLength(0);
  });
});
