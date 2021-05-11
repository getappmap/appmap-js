/* eslint-disable no-restricted-syntax */
import buildAppMap from '../../../src/appMapBuilder';
import { scan } from '../../../src/scanners';
import { IllegalPackageDependency } from '../../../src/scanners/illegalPackageDependency';
import apiKeyScenario from '../fixtures/revoke_api_key.appmap.json';

const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

describe('IllegalPackageDependency', () => {
  test('guards access to the SQL package', () => {
    // Alternatively, 'app/controllers', ['HTTP']
    const { targets, matches, errors } = scan(
      new IllegalPackageDependency('SQL', ['app/models'])
    )(apiKeyAppMap.events);
    expect(targets).not.toEqual([]);
    expect(matches).toEqual([]);
    expect(errors).toEqual([]);
  });
});
