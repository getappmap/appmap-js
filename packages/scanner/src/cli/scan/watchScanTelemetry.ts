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
      const scanEvents = events.map(({ args: [event] }) => event) as ScanEvent[];
      this.sendTelemetry(scanEvents);
    }).attach(scanEvents, 'scan');
  }

  private sendTelemetry(scanEvents: ScanEvent[]) {
    const ruleIds = new Set<string>();
    let numAppMaps = 0;
    let numFindings = 0;
    let elapsed = 0;
    for (const scanEvent of scanEvents) {
      scanEvent.scanResults.summary.rules.forEach((rule) => ruleIds.add(rule));
      numAppMaps += scanEvent.scanResults.summary.numAppMaps;
      numFindings += scanEvent.scanResults.summary.numFindings;
      elapsed += scanEvent.elapsed;
    }

    sendScanResultsTelemetry({
      ruleIds: [...ruleIds],
      numAppMaps,
      numFindings,
      elapsedMs: elapsed,
    });
  }
}
