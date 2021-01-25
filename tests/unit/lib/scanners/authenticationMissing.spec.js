/* eslint-disable no-restricted-syntax */
import { buildAppMap } from '@/lib/models';
import { PROVIDER_AUTHENTICATION } from '../../../../src/lib';
import { AuthenticationMissing } from '../../../../src/lib/scanners/authenticationMissing';
import ScanError from '../../../../src/lib/scanners/scanError';
import apiKeyScenario from '../../fixtures/revoke_api_key.appmap.json';

const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

describe('EventNavigator', () => {
  function scanAuthenticationMissing(event) {
    const scan = new AuthenticationMissing([event]);
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
    return { errors, authenticators };
  }

  test('authentication provider not found', () => {
    const { errors, authenticators } = scanAuthenticationMissing(
      apiKeyAppMap.events[6],
    );

    expect(authenticators).toEqual([]);
    expect(errors).not.toEqual([]);
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      `No authentication provider found in DELETE /api/api_keys`,
    );
  });

  test('authentication provider is found', () => {
    const authenticator = apiKeyAppMap.events.find(
      (e) => e.isCall() && e.methodId === 'authenticate',
    );
    authenticator.codeObject.data.labels = new Set([PROVIDER_AUTHENTICATION]);

    const { errors, authenticators } = scanAuthenticationMissing(
      apiKeyAppMap.events[6],
    );

    expect(authenticators).not.toEqual([]);
    expect(authenticators.length).toEqual(1);
    expect(authenticators[0].event.id).toEqual(8);
    expect(errors).toEqual([]);
  });
});
