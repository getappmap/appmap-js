import { EventEmitter } from 'stream';
import EventAggregator from '../../lib/eventAggregator';
import { ScanResults, sendScanResultsTelemetry } from '../../report/scanResults';

export type ScanEvent = {
  scanResults: ScanResults;
  elapsed: number;
};

export class WatchScanTelemetry {
  constructor(scanEvents: EventEmitter) {
    new EventAggregator<ScanEvent>((events) => {
      const scanEvents = events.map((e) => e.arg);
      this.sendTelemetry(scanEvents);
    }).attach(scanEvents, 'scan');
  }

  private sendTelemetry(scanEvents: ScanEvent[]) {
    const ruleIds = new Set<string>();
    let elapsed = 0;
    let telemetryScanResults = new ScanResults();
    for (const scanEvent of scanEvents) {
      telemetryScanResults.aggregate(scanEvent.scanResults);
      elapsed += scanEvent.elapsed;
    }
    telemetryScanResults.summary.rules.forEach((rule) => ruleIds.add(rule));

    sendScanResultsTelemetry({
      ruleIds: [...ruleIds],
      numAppMaps: telemetryScanResults.summary.numAppMaps,
      numFindings: telemetryScanResults.summary.numFindings,
      elapsedMs: elapsed,
    });
  }
}
