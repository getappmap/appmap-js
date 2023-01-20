import { EventEmitter } from 'stream';
import EventAggregator, { CancelFn } from '../../lib/eventAggregator';
import { ScanResults, sendScanResultsTelemetry } from '../../report/scanResults';

export type ScanEvent = {
  scanResults: ScanResults;
  elapsed: number;
};

export class WatchScanTelemetry {
  cancelFn: CancelFn | undefined;

  constructor(scanEvents: EventEmitter, private readonly appmapDir?: string) {
    this.cancelFn = new EventAggregator<ScanEvent>((events) => {
      const scanEvents = events.map((e) => e.arg);
      this.sendTelemetry(scanEvents);
    }).attach(scanEvents, 'scan');
  }

  cancel(): void {
    if (this.cancelFn) this.cancelFn();

    this.cancelFn = undefined;
  }

  static watch(scanEvents: EventEmitter, appmapDir?: string): CancelFn {
    const telemetry = new WatchScanTelemetry(scanEvents, appmapDir);
    return () => telemetry.cancel();
  }

  private sendTelemetry(scanEvents: ScanEvent[]) {
    const ruleIds = new Set<string>();
    let elapsed = 0;
    const telemetryScanResults = new ScanResults();
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
      appmapDir: this.appmapDir,
    });
  }
}
