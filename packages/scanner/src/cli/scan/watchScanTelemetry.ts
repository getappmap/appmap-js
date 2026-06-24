import { EventEmitter } from 'stream';
import EventAggregator, { CancelFn } from '../../util/eventAggregator';
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

  cancel(): void {
    this.aggregator.cancel();
  }

  static watch(scanEvents: EventEmitter, appmapDir?: string): CancelFn {
    const telemetry = new WatchScanTelemetry(scanEvents, appmapDir);
    return () => telemetry.cancel();
  }

  private sendTelemetry(scanEvents: ScanEvent[]) {
    let elapsed = 0;
    const telemetryScanResults = new ScanResults();
    for (const scanEvent of scanEvents) {
      telemetryScanResults.aggregate(scanEvent.scanResults);
      elapsed += scanEvent.elapsed;
    }

    sendScanResultsTelemetry({
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
