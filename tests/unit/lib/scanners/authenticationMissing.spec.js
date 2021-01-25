/* eslint-disable no-restricted-syntax */
import { buildAppMap } from '@/lib/models';
import { AuthenticationMissing } from '../../../../src/lib/scanners/authenticationMissing';
import ScanError from '../../../../src/lib/scanners/scanError';
import apiKeyScenario from '../../fixtures/revoke_api_key.appmap.json';

const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

describe('EventNavigator', () => {
  test('authentication provider not found', () => {
    const scan = new AuthenticationMissing([apiKeyAppMap.events[6]]);
    const errors = [];
    const authenticators = [];
    for (const scope of scan.scopes()) {
      for (const authn of scope.evaluate()) {
        if (authn instanceof ScanError) {
          errors.push(authn);
        } else {
          authenticators.push(authn);
        }
      }
    }
    expect(authenticators).toEqual([]);
    expect(errors).not.toEqual([]);
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      `No authentication provider found in DELETE /api/api_keys`,
    );
  });
});
