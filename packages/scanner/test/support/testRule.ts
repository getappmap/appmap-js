import { scan } from '../util';
import Check from '../../src/check';
import testMap, { TestMap } from './testMap';
import RuleInstance from '../../src/ruleInstance';
import { Finding } from '../../src';

export default async function testRule(rule: RuleInstance, map: TestMap): Promise<Finding[]> {
  return (await scan(new Check(rule), 'test', testMap(map))).findings;
}
