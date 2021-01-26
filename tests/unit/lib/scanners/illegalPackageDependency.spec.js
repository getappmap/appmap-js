/* eslint-disable no-restricted-syntax */
import { buildAppMap } from '@/lib/models';
import { IllegalPackageDependency } from '../../../../src/lib/scanners/illegalPackageDependency';
import apiKeyScenario from '../../fixtures/revoke_api_key.appmap.json';

const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

describe('Scanner', () => {
  test('guards SQL access', () => {
    // Alternatively, 'app/controllers', ['HTTP']
    const scan = new IllegalPackageDependency('SQL', ['app/models']);
    const targets = [];
    const errors = [];
    for (const scope of scan.scopes(apiKeyAppMap.events)) {
      for (const target of scope.targets()) {
        targets.push(target);
        for (const error of target.evaluate()) {
          errors.push(error);
        }
      }
    }
    expect(targets).not.toEqual([]);
    expect(errors).toEqual([]);
  });
});
