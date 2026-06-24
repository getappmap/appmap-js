import type { EventEmitter } from 'stream';
import EventAggregator from '../../util/eventAggregator';
import { ScanResults, sendScanResultsTelemetry } from '../../report/scanResults';

export type ScanEvent = {
  scanResults: ScanResults;
  elapsed: number;
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
    for (const scanEvent of scanEvents) {
      telemetryScanResults.aggregate(scanEvent.scanResults);
      elapsed += scanEvent.elapsed;
    }

    return sendScanResultsTelemetry({
      ruleIds: telemetryScanResults.summary.rules,
      numAppMaps: telemetryScanResults.summary.numAppMaps,
      numFindings: telemetryScanResults.summary.numFindings,
      findingCountsByRule: telemetryScanResults.summary.findingCountsByRule,
      findingCountsByImpactDomain: telemetryScanResults.summary.findingCountsByImpactDomain,
      elapsedMs: elapsed,
      appmapDir: this.appmapDir,
    });
  }
}
