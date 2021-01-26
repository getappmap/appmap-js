/* eslint-disable no-restricted-syntax */
import { buildAppMap } from '@/lib/models';
import { PROVIDER_AUTHENTICATION, scan } from '../../../../src/lib';
import { AuthenticationMissing } from '../../../../src/lib/scanners/authenticationMissing';
import ScanError from '../../../../src/lib/scanners/scanError';
import apiKeyScenario from '../../fixtures/revoke_api_key.appmap.json';

const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

describe('Scanner', () => {
  function scanAuthenticationMissing(event) {
    const scan = new AuthenticationMissing();
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
    const scanEvent = apiKeyAppMap.events[6];
    const { targets, matches, errors } = scan(new AuthenticationMissing())([
      scanEvent,
    ]);

    expect(targets).not.toEqual([]);
    expect(matches).toEqual([]);
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

    const scanEvent = apiKeyAppMap.events[6];
    const { targets, matches, errors } = scan(new AuthenticationMissing())([
      scanEvent,
    ]);

    expect(targets).not.toEqual([]);
    expect(matches).not.toEqual([]);
    expect(matches.length).toEqual(1);
    expect(matches[0].event.id).toEqual(8);
    expect(errors).toEqual([]);
  });
});
