import { Finding } from '../../src';
import { ScanResults, scanCompletedEvent, ScanTelemetry } from '../../src/report/scanResults';

const finding = (ruleId: string, impactDomain?: string): Finding =>
  ({ ruleId, impactDomain } as Finding);

describe('ScanResults finding breakdowns', () => {
  it('counts findings by rule and by impact domain', () => {
    const results = new ScanResults(
      { checks: [] },
      {},
      [
        finding('rule-a', 'Security'),
        finding('rule-a', 'Security'),
        finding('rule-b', 'Performance'),
      ],
      []
    );

    expect(results.summary.findingCountsByRule).toEqual({ 'rule-a': 2, 'rule-b': 1 });
    expect(results.summary.findingCountsByImpactDomain).toEqual({ Security: 2, Performance: 1 });
  });

  it('ignores findings with no impact domain in the impact-domain breakdown', () => {
    const results = new ScanResults({ checks: [] }, {}, [finding('rule-a')], []);

    expect(results.summary.findingCountsByRule).toEqual({ 'rule-a': 1 });
    expect(results.summary.findingCountsByImpactDomain).toEqual({});
  });

  it('sums the breakdowns when aggregating scan results', () => {
    const a = new ScanResults({ checks: [] }, {}, [finding('rule-a', 'Security')], []);
    const b = new ScanResults(
      { checks: [] },
      {},
      [finding('rule-a', 'Security'), finding('rule-c', 'Stability')],
      []
    );

    a.aggregate(b);

    expect(a.summary.numFindings).toBe(3);
    expect(a.summary.findingCountsByRule).toEqual({ 'rule-a': 2, 'rule-c': 1 });
    expect(a.summary.findingCountsByImpactDomain).toEqual({ Security: 2, Stability: 1 });
  });
});

describe('scanCompletedEvent', () => {
  const telemetry: ScanTelemetry = {
    ruleIds: ['rule-b', 'rule-a'],
    numAppMaps: 3,
    numFindings: 5,
    findingCountsByRule: { 'rule-b': 2, 'rule-a': 3 },
    findingCountsByImpactDomain: { Security: 3, Performance: 2 },
    elapsedMs: 2000,
  };

  it('builds a scan:completed event with per-rule and impact-domain breakdowns', () => {
    const event = scanCompletedEvent(telemetry, 'Ok', 4);

    expect(event.name).toBe('scan:completed');
    expect(event.properties).toEqual({
      rules: 'rule-a, rule-b',
      git_state: 'Ok',
      findingsByRule: JSON.stringify({ 'rule-a': 3, 'rule-b': 2 }),
      findingsByImpactDomain: JSON.stringify({ Performance: 2, Security: 3 }),
    });
    expect(event.metrics).toEqual({
      duration: 2,
      numRules: 2,
      numAppMaps: 3,
      numFindings: 5,
      contributors: 4,
    });
  });
});
