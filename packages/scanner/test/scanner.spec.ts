import slowHttpServerRequest from '../src/scanner/slowHttpServerRequest';
import missingAuthentication from '../src/scanner/missingAuthentication';
import secretInLog from '../src/scanner/secretInLog';
import nPlusOneQuery from '../src/scanner/nPlusOneQuery';
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
    const finding = findings[0];
    expect(finding.appMapName).toEqual('Users_profile profile display while anonyomus');
    expect(finding.scannerId).toEqual('n-plus-one-query');
    expect(finding.event.id).toEqual(91);
    expect(finding.message).toEqual(
      `29 occurrances of SQL "SELECT "active_storage_attachments".* FROM "active_storage_attachments" WHERE "active_storage_attachments"."record_id" = ? AND "active_storage_attachments"."record_type" = ? AND "active_storage_attachments"."name" = ? LIMIT ?"`
    );
  });
});
