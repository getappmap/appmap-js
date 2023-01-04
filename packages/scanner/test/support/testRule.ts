import { scan } from '../util';
import Check from '../../src/check';
import testMap, { TestMap } from './testMap';
import { Finding, Rule } from '../../src/types';

export default async function testRule(rule: Rule, map: TestMap): Promise<Finding[]> {
  return (await scan(new Check(rule), 'test', testMap(map))).findings;
}
