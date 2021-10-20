import slowHttpServerRequest from '../src/scanner/slowHttpServerRequest';
import missingAuthentication from '../src/scanner/missingAuthentication';
import secretInLog from '../src/scanner/secretInLog';
import nPlusOneQuery from '../src/scanner/nPlusOneQuery';
import insecureCompare from '../src/scanner/insecureCompare';
import http500 from '../src/scanner/http500';
import illegalPackageAccess from '../src/scanner/illegalPackageDependency';
import rpcWithoutCircuitBreaker from '../src/scanner/rpcWithoutCircuitBreaker';
import { scan } from './util';
import { ScopeName } from '../src/types';
import Assertion from '../src/assertion';

const makePrototype = (id: string, buildFn: () => Assertion, scope: ScopeName = 'all') => {
  return {
    config: { id },
    scope: scope || 'all',
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
      'Users_profile_profile_display_while_anonyomus.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.appMapName).toEqual('Users_profile profile display while anonyomus');
    expect(finding.scannerId).toEqual('slow-http-server-request');
    expect(finding.event.id).toEqual(27);
    expect(finding.message).toBeNull();
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
    expect(finding.event.id).toEqual(27);
    expect(finding.message).toBeNull();
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
      expect(finding.event.id).toEqual(313);
      expect(finding.message).toEqual(
        '[c7c8411d-c02c-4568-807e-b761348ada27] Started GET "/account_activations/rGirqVd8HfLFZZGvxLbCzA/edit contains secret rGirqVd8HfLFZZGvxLbCzA'
      );
    }
    {
      const finding = findings[1];
      expect(finding.scannerId).toEqual('secret-in-log');
      expect(finding.event.id).toEqual(369);
    }
  });

  it('n+1 query', async () => {
    const { scanner } = nPlusOneQuery;
    const findings = await scan(
      makePrototype('n-plus-one-query', () => scanner()),
      'Users_profile_profile_display_while_anonyomus.appmap.json'
    );

    expect(findings).toHaveLength(2);
    // It's important that there is only one finding, since the query repeats 29 times.
    // That's one finding; not 29 findings.
    const finding1 = findings[0];
    expect(finding1.appMapName).toEqual('Users_profile profile display while anonyomus');
    expect(finding1.scannerId).toEqual('n-plus-one-query');
    expect(finding1.event.id).toEqual(131);
    expect(finding1.message).toEqual(
      `5 occurrances of SQL "SELECT "active_storage_attachments".* FROM "active_storage_attachments" WHERE "active_storage_attachments"."record_id" = ? AND "active_storage_attachments"."record_type" = ? AND "active_storage_attachments"."name" = ? LIMIT ?"`
    );

    const finding2 = findings[1];
    expect(finding2.event.id).toEqual(181);
    expect(finding2.message).toEqual(
      `10 occurrances of SQL "SELECT "active_storage_attachments".* FROM "active_storage_attachments" WHERE "active_storage_attachments"."record_id" = ? AND "active_storage_attachments"."record_type" = ? AND "active_storage_attachments"."name" = ? LIMIT ?"`
    );
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
    const { scanner, scope } = http500;
    const findings = await scan(
      makePrototype('http-500', () => scanner()),
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
    expect(finding.event.id).toEqual(40);
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
});
