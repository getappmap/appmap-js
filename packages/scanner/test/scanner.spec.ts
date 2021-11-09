import { buildAppMap } from '@appland/models';
import slowHttpServerRequest from '../src/scanner/slowHttpServerRequest';
import missingAuthentication from '../src/scanner/missingAuthentication';
import secretInLog from '../src/scanner/secretInLog';
import nPlusOneQuery from '../src/scanner/nPlusOneQuery';
import tooManyUpdates from '../src/scanner/tooManyUpdates';
import insecureCompare from '../src/scanner/insecureCompare';
import http500 from '../src/scanner/http500';
import illegalPackageAccess from '../src/scanner/illegalPackageDependency';
import rpcWithoutCircuitBreaker from '../src/scanner/rpcWithoutCircuitBreaker';
import incompatibleHTTPClientRequest from '../src/scanner/incompatibleHttpClientRequest';
import slowFunctionCall from '../src/scanner/slowFunctionCall';
import tooManyJoins from '../src/scanner/tooManyJoins';
import authzBeforeAuthn from '../src/scanner/authzBeforeAuthn';
import { fixtureAppMap, scan } from './util';
import { AssertionPrototype, ScopeName } from '../src/types';
import Assertion from '../src/assertion';
import { cwd } from 'process';
import { join, normalize } from 'path';
import { readFile } from 'fs/promises';

const makePrototype = (
  id: string,
  buildFn: () => Assertion,
  scope: ScopeName = 'appmap',
  enumerateScope = true
): AssertionPrototype => {
  return {
    config: { id },
    scope: scope,
    enumerateScope,
    build: buildFn,
  };
};

describe('assert', () => {
  it('slow HTTP server request', async () => {
    const { scope, scanner, Options } = slowHttpServerRequest;
    const findings = await scan(
      makePrototype(
        'slow-http-server-request',
        () => scanner(new Options(0.5)),
        scope as ScopeName
      ),
      'Password_resets_password_resets.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.appMapName).toEqual('Password_resets password resets');
    expect(finding.scannerId).toEqual('slow-http-server-request');
    expect(finding.event.id).toEqual(411);
    expect(finding.message).toBeUndefined();
    expect(finding.condition).toEqual('Slow HTTP server request (> 500ms)');
  });

  it('missing authentication', async () => {
    const { scope, scanner } = missingAuthentication;
    const findings = await scan(
      makePrototype('secret-in-log', () => scanner(), scope as ScopeName),
      'Users_profile_profile_display_while_anonyomus.appmap.json'
    );

    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('missing-authentication');
    expect(finding.event.id).toEqual(31);
    expect(finding.message).toBeUndefined();
  });

  it('secret in log file', async () => {
    const { scanner } = secretInLog;
    const findings = await scan(
      makePrototype('secret-in-log', () => scanner()),
      'Users_signup_valid_signup_information_with_account_activation.appmap.json'
    );
    expect(findings).toHaveLength(2);
    {
      const finding = findings[0];
      expect(finding.scannerId).toEqual('secret-in-log');
      expect(finding.event.id).toEqual(695);
      expect(finding.message).toEqual(
        `[2f025606-b6f0-4b64-8595-006f32f4d5d0] Started GET "/account_activations/-6SputWUtvALn3TLCfoYvA/edit contains secret -6SputWUtvALn3TLCfoYvA`
      );
    }
    {
      const finding = findings[1];
      expect(finding.scannerId).toEqual('secret-in-log');
      expect(finding.event.id).toEqual(817);
    }
  });

  it('n+1 query', async () => {
    const { scope, enumerateScope, scanner } = nPlusOneQuery;
    const findings = await scan(
      makePrototype('n-plus-one-query', () => scanner(), scope as ScopeName, enumerateScope),
      'Users_profile_profile_display_while_anonyomus.appmap.json'
    );

    expect(findings).toHaveLength(1);
    // It's important that there is only one finding, since the query repeats 30 times.
    // That's one finding; not 30 findings.
    const finding1 = findings[0];
    expect(finding1.appMapName).toEqual('Users_profile profile display while anonyomus');
    expect(finding1.scannerId).toEqual('n-plus-one-query');
    expect(finding1.event.id).toEqual(133);
    expect(finding1.relatedEvents!).toHaveLength(30);
    expect(finding1.message).toEqual(
      `30 occurrences of SQL "SELECT "active_storage_attachments".* FROM "active_storage_attachments" WHERE "active_storage_attachments"."record_id" = ? AND "active_storage_attachments"."record_type" = ? AND "active_storage_attachments"."name" = ? LIMIT ?"`
    );
  });

  it('too many updates', async () => {
    const { scope, enumerateScope, Options, scanner } = tooManyUpdates;
    const findings = await scan(
      makePrototype(
        'too-many-updates',
        () => scanner(new Options(2)),
        scope as ScopeName,
        enumerateScope
      ),
      'PaymentsController_create_no_user_email_on_file_makes_a_onetime_payment_with_no_user_but_associate_with_stripe.appmap.json'
    );
    expect(findings).toHaveLength(1);
    // It's important that there is only one finding, since the query repeats 30 times.
    // That's one finding; not 30 findings.
    const finding1 = findings[0];
    expect(finding1.appMapName).toEqual(
      'PaymentsController create no user email on file makes a onetime payment with no user, but associate with stripe'
    );
    expect(finding1.scannerId).toEqual('too-many-updates');
    expect(finding1.event.id).toEqual(89);
    expect(finding1.message).toEqual(`Command performs 3 SQL and RPC updates`);
    expect(finding1.relatedEvents!).toHaveLength(3);
  });

  it('insecure comparison', async () => {
    const { scanner } = insecureCompare;
    const findings = await scan(
      makePrototype('insecure-compare', () => scanner()),
      'Password_resets_password_resets_with_insecure_compare.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('insecure-compare');
    expect(finding.event.id).toEqual(1094);
  });

  it('http 500', async () => {
    const { scope, scanner } = http500;
    const findings = await scan(
      makePrototype('http-500', () => scanner(), scope as ScopeName),
      'Password_resets_password_resets_with_http500.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('http-5xx');
    expect(finding.event.id).toEqual(1789);
  });

  it('illegal package dependency', async () => {
    const { scanner, Options } = illegalPackageAccess;
    const findings = await scan(
      makePrototype('illegal-package-dependency', () =>
        scanner(new Options('query:*', ['app/views']))
      ),
      'Users_profile_profile_display_while_anonyomus.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('illegal-package-dependency');
    expect(finding.event.id).toEqual(48);
    expect(finding.message).toEqual(
      `Code object Database->SELECT "users".* FROM "users" WHERE "users"."id" = ? LIMIT ? was invoked from app/controllers, not from app/views`
    );
  });

  it('rpc without circuit breaker creates a finding', async () => {
    const { scanner } = rpcWithoutCircuitBreaker;
    const findings = await scan(
      makePrototype('rpc-without-circuit-breaker', () => scanner()),
      'PaymentsController_create_no_user_email_on_file_makes_a_onetime_payment_with_no_user_but_associate_with_stripe.appmap.json'
    );
    expect(findings).toHaveLength(4);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('rpc-without-circuit-breaker');
    expect(finding.event.id).toEqual(19);
  });

  it('all rpc have a circuit breaker ', async () => {
    const { scanner } = rpcWithoutCircuitBreaker;
    const findings = await scan(
      makePrototype('rpc-without-circuit-breaker', () => scanner()),
      'Test_net_5xxs_trip_circuit_when_fatal_server_flag_enabled.appmap.json'
    );
    expect(findings).toHaveLength(0);
  });

  it('slow function call', async () => {
    const { scanner, Options } = slowFunctionCall;
    const findings = await scan(
      makePrototype('slow-function-call', () => scanner(new Options(0.2, '.*Controller#create'))),
      'Microposts_interface_micropost_interface.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('slow-function-call');
    expect(finding.event.id).toEqual(897);
    expect(finding.message).toEqual(
      'Slow app/controllers/MicropostsController#create call (0.228481ms)'
    );
  });

  it('incompatible http client requests', async () => {
    const railsSampleAppSchemaURL = `file://${normalize(
      join(cwd(), 'test', 'fixtures', 'schemata', 'railsSampleApp6thEd.openapiv3.yaml')
    )}`;
    const { scanner, Options } = incompatibleHTTPClientRequest;
    const findings = await scan(
      makePrototype('incompatible-http-client-request', () =>
        scanner(new Options({ 'api.stripe.com': railsSampleAppSchemaURL }))
      ),
      'PaymentsController_create_no_user_email_on_file_makes_a_onetime_payment_with_no_user_but_associate_with_stripe.appmap.json'
    );
    expect(findings).toHaveLength(4);
    const finding = findings[0];
    expect(finding.event.id).toEqual(19);
    expect(finding.message).toEqual(
      `HTTP client request is incompatible with OpenAPI schema. Change details: remove paths./v1/tokens`
    );
  });

  it('too many joins', async () => {
    const { scope, enumerateScope, scanner, Options } = tooManyJoins;
    const findings = await scan(
      makePrototype(
        'too-many-joins',
        () => scanner(new Options(1)),
        scope as ScopeName,
        enumerateScope
      ),
      'Users_profile_profile_display_while_anonyomus.appmap.json'
    );
    expect(findings).toHaveLength(2);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('too-many-joins');
    expect(finding.event.id).toEqual(97);
    expect(finding.message).toEqual(
      '1 join in SQL "SELECT COUNT(*) FROM "users" INNER JOIN "relationships" ON "users"."id" = "relationships"."followed_id" WHERE "relationships"."follower_id" = ?"'
    );
  });

  it('detects authorization before authentication', async () => {
    const scanner = authzBeforeAuthn.scanner as () => Assertion;
    const findings = await scan(
      makePrototype('authz-before-authn', () => scanner()),
      'Test_authz_before_authn.appmap.json'
    );
    expect(findings).toHaveLength(0);
  });

  it('detects authorization before authentication', async () => {
    const scanner = authzBeforeAuthn.scanner as () => Assertion;

    // Remove security.authentication labels from the AppMap in order to
    // trigger the finding.
    const appMapBytes = await readFile(
      fixtureAppMap('Test_authz_before_authn.appmap.json'),
      'utf8'
    );
    const baseAppMap = JSON.parse(appMapBytes);
    const removeAuthenticationLabel = (codeObject: any) => {
      if (codeObject.labels) {
        codeObject.labels = codeObject.labels.filter(
          (label: string) => label !== 'security.authentication'
        );
      }
      (codeObject.children || []).forEach(removeAuthenticationLabel);
    };
    baseAppMap.classMap.forEach(removeAuthenticationLabel);
    const appMapData = buildAppMap(JSON.stringify(baseAppMap)).normalize().build();

    const findings = await scan(
      makePrototype('authz-before-authn', () => scanner()),
      undefined,
      appMapData
    );
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('authz-before-authn');
    expect(finding.event.id).toEqual(1);
    expect(finding.message).toEqual(
      `MicropostsController#correct_user provides authorization, but the request is not authenticated`
    );
    expect(finding.relatedEvents!.map((e) => e.id)).toEqual([16]);
  });
});
