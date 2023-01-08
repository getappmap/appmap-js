import { Rule } from '../../src/types';
import { TestMap } from './testMap';
import testRule from './testRule';

type RuleTestCase = [string, TestMap, number];

export default function describeRule(rule: Rule, cases: RuleTestCase[]): void {
  return describe(rule.title, () => {
    cases.map(([title, map, findingCount]) => {
      it(title, async () => {
        const findings = await testRule(rule, map);
        expect(findings.length).toEqual(findingCount);
        for (const { checkId } of findings) expect(checkId).toEqual(rule.id);
      });
    });
  });
}
