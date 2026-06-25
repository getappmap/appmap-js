import { EventEmitter } from 'events';
import type { Metadata } from '@appland/models';

import type { Finding } from '../../../src';
import * as scanResultsModule from '../../../src/report/scanResults';
import { WatchScanTelemetry } from '../../../src/cli/scan/watchScanTelemetry';

const { ScanResults } = scanResultsModule;

const finding = (ruleId: string, impactDomain?: string): Finding =>
  ({ ruleId, impactDomain, hash_v2: `${ruleId}-${impactDomain}` } as Finding);

const scanResultsFor = (appmap: string, findings: Finding[]): InstanceType<typeof ScanResults> =>
  new ScanResults({ checks: [] }, { [appmap]: {} as Metadata }, findings, []);

describe('WatchScanTelemetry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('batches scan events and sends a single aggregated scan:completed', async () => {
    const send = jest
      .spyOn(scanResultsModule, 'sendScanResultsTelemetry')
      .mockResolvedValue(undefined);

    const emitter = new EventEmitter();
    const telemetry = new WatchScanTelemetry(emitter, '/tmp/appmaps');

    emitter.emit('scan', {
      scanResults: scanResultsFor('a', [finding('rule-a', 'Security')]),
      elapsed: 1000,
      diff: { newFindings: [finding('rule-a', 'Security')], resolvedFindings: [] },
    });
    emitter.emit('scan', {
      scanResults: scanResultsFor('b', [
        finding('rule-a', 'Security'),
        finding('rule-b', 'Performance'),
      ]),
      elapsed: 500,
      diff: {
        newFindings: [finding('rule-b', 'Performance')],
        resolvedFindings: [finding('rule-c', 'Stability')],
      },
    });

    jest.advanceTimersByTime(10_000);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        numAppMaps: 2,
        numFindings: 3,
        findingCountsByRule: { 'rule-a': 2, 'rule-b': 1 },
        findingCountsByImpactDomain: { Security: 2, Performance: 1 },
        numNewFindings: 2,
        numResolvedFindings: 1,
        newFindingCountsByRule: { 'rule-a': 1, 'rule-b': 1 },
        newFindingCountsByImpactDomain: { Security: 1, Performance: 1 },
        elapsedMs: 1500,
        appmapDir: '/tmp/appmaps',
      })
    );

    await telemetry.cancel();
  });

  it('stops listening for scan events once cancelled', async () => {
    const send = jest
      .spyOn(scanResultsModule, 'sendScanResultsTelemetry')
      .mockResolvedValue(undefined);

    const emitter = new EventEmitter();
    const telemetry = new WatchScanTelemetry(emitter, '/tmp/appmaps');
    await telemetry.cancel();

    emitter.emit('scan', {
      scanResults: scanResultsFor('a', [finding('rule-a', 'Security')]),
      elapsed: 1000,
    });
    jest.advanceTimersByTime(10_000);

    expect(send).not.toHaveBeenCalled();
  });
});
