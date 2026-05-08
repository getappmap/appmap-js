import { deriveKind, looksLikeDisplayLabel } from '../../../../../src/cmds/query/lib/appmapPath';

describe('deriveKind', () => {
  it('detects junit recordings', () => {
    expect(deriveKind('/abs/tmp/appmap/junit/foo.appmap.json')).toBe('junit');
  });

  it('detects request recordings', () => {
    expect(
      deriveKind('/abs/tmp/appmap/request_recording/1779_post_orders.appmap.json')
    ).toBe('request');
  });

  it('falls back to "other" for unrecognized layouts', () => {
    expect(deriveKind('/abs/tmp/appmap/cucumber/foo.appmap.json')).toBe('other');
  });
});

describe('looksLikeDisplayLabel', () => {
  it('rejects HTTP-method + paren-status display labels', () => {
    expect(
      looksLikeDisplayLabel('GET /api/v1/payments/idempotent (200) - 19:47:22.660')
    ).toBe(true);
  });

  it('rejects strings that contain a trailing time-of-day component', () => {
    expect(looksLikeDisplayLabel('something - 14:05:31')).toBe(true);
  });

  it('accepts canonical absolute paths', () => {
    expect(
      looksLikeDisplayLabel(
        '/Users/me/proj/customer-portal-api/tmp/appmap/junit/foo.appmap.json'
      )
    ).toBe(false);
  });

  it('accepts recording names', () => {
    expect(
      looksLikeDisplayLabel('com_omnibank_DuplicatePaymentRaceIT_concurrent_submissions')
    ).toBe(false);
  });

  it('accepts numeric ids', () => {
    expect(looksLikeDisplayLabel('2')).toBe(false);
  });
});
