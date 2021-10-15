import slowHttpServerRequest from '../src/scanner/slowHttpServerRequest';
import missingAuthentication from '../src/scanner/missingAuthentication';
import secretInLog from '../src/scanner/secretInLog';
import nPlusOneQuery from '../src/scanner/nPlusOneQuery';
import insecureCompare from '../src/scanner/insecureCompare';
import http500 from '../src/scanner/http500';
import illegalPackageAccess from '../src/scanner/illegalPackageDependency';
import { scan } from './util';

describe('assert', () => {
  it('slow HTTP server request', async () => {
    const scanner = slowHttpServerRequest.scanner(new slowHttpServerRequest.Options(0.5));
    const findings = await scan(
      scanner,
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
    const scanner = missingAuthentication.scanner();
    const findings = await scan(
      scanner,
      'Users_profile_profile_display_while_anonyomus.appmap.json'
    );

    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('missing-authentication');
    expect(finding.event.id).toEqual(27);
    expect(finding.message).toBeNull();
  });

  it('secret in log file', async () => {
    const scanner = secretInLog.scanner();
    const findings = await scan(
      scanner,
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
    const scanner = nPlusOneQuery.scanner();
    const findings = await scan(
      scanner,
      'Users_profile_profile_display_while_anonyomus.appmap.json'
    );
    expect(findings).toHaveLength(1);
    // It's important that there is only one finding, since the query repeats 29 times.
    // That's one finding; not 29 findings.
    const finding = findings[0];
    expect(finding.appMapName).toEqual('Users_profile profile display while anonyomus');
    expect(finding.scannerId).toEqual('n-plus-one-query');
    expect(finding.event.id).toEqual(91);
    expect(finding.message).toEqual(
      `29 occurrances of SQL "SELECT "active_storage_attachments".* FROM "active_storage_attachments" WHERE "active_storage_attachments"."record_id" = ? AND "active_storage_attachments"."record_type" = ? AND "active_storage_attachments"."name" = ? LIMIT ?"`
    );
  });

  it('insecure comparison', async () => {
    const scanner = insecureCompare.scanner();
    const findings = await scan(
      scanner,
      'Password_resets_password_resets_with_insecure_compare.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('insecure-compare');
    expect(finding.event.id).toEqual(1094);
  });

  it('http 500', async () => {
    const scanner = http500.scanner();
    const findings = await scan(
      scanner,
      'Password_resets_password_resets_with_http500.appmap.json'
    );
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.scannerId).toEqual('http-5xx');
    expect(finding.event.id).toEqual(1789);
  });

  it('illegal package dependency', async () => {
    const scanner = illegalPackageAccess.scanner(
      new illegalPackageAccess.Options('query:*', ['app/views'])
    );
    const findings = await scan(
      scanner,
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
});
