import type { EventEmitter } from 'stream';
import EventAggregator from '../../util/eventAggregator';
import { countFindings, ScanResults, sendScanResultsTelemetry } from '../../report/scanResults';
import type { Finding } from '../../index';
import type { FindingsDiff } from '../../report/findingsDiff';

export type ScanEvent = {
  scanResults: ScanResults;
  elapsed: number;
  diff: FindingsDiff;
};

export class WatchScanTelemetry {
  private readonly aggregator: EventAggregator<ScanEvent>;

  constructor(scanEvents: EventEmitter, private readonly appmapDir?: string) {
    this.aggregator = new EventAggregator<ScanEvent>(scanEvents, 'scan', (events) =>
      this.sendTelemetry(events)
    );
  }

  cancel(): Promise<void> {
    return this.aggregator.cancel();
  }

  private sendTelemetry(scanEvents: ScanEvent[]): Promise<void> {
    let elapsed = 0;
    const telemetryScanResults = new ScanResults();
    const newFindings: Finding[] = [];
    const resolvedFindings: Finding[] = [];
    for (const scanEvent of scanEvents) {
      telemetryScanResults.aggregate(scanEvent.scanResults);
      elapsed += scanEvent.elapsed;
      newFindings.push(...scanEvent.diff.newFindings);
      resolvedFindings.push(...scanEvent.diff.resolvedFindings);
    }

    return sendScanResultsTelemetry({
      ruleIds: telemetryScanResults.summary.rules,
      numAppMaps: telemetryScanResults.summary.numAppMaps,
      numFindings: telemetryScanResults.summary.numFindings,
      findingCountsByRule: telemetryScanResults.summary.findingCountsByRule,
      findingCountsByImpactDomain: telemetryScanResults.summary.findingCountsByImpactDomain,
      numNewFindings: newFindings.length,
      numResolvedFindings: resolvedFindings.length,
      newFindingCountsByRule: countFindings(newFindings, (f) => f.ruleId),
      newFindingCountsByImpactDomain: countFindings(newFindings, (f) => f.impactDomain),
      elapsedMs: elapsed,
      appmapDir: this.appmapDir,
    });
  }
}
