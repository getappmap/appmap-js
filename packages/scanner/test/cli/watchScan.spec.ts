import { Watcher, WatchScanOptions } from '../../src/cli/scan/watchScan';
import { ScanResults} from '../../src/report/scanResults';
import Configuration from '../../src/configuration/types/configuration';
import { withStubbedTelemetry } from '../helper';

describe('watchScan', () => {
  withStubbedTelemetry();
  const options: WatchScanOptions = {
    appId: "appId",
    appmapDir: 'tmp/dummy',
    configFile: 'dummy_config',
  };
  const blankScanResults = new ScanResults();
  
  it('does not crash if there are no telemetry events', async () => {
    const watcher: Watcher = new Watcher(options);
    clearInterval(watcher.interval); // disable the timer

    watcher.sendScanResultsTelemetryInABatch();
    expect(watcher.batchedTelemetry.length).toBe(0);
  });

  it('does not send telemetry events if the period has not elapsed', async () => {
    const watcher: Watcher = new Watcher(options);
    clearInterval(watcher.interval); // disable the timer

    watcher.batchedTelemetry.push({
      telemetryName: 'scan:complete',
      scanResults: blankScanResults,
      msElapsed: 10,
      msInserted: Date.now(),
    });
    watcher.sendScanResultsTelemetryInABatch();
    expect(watcher.batchedTelemetry.length).toBe(1); // wasn't sent
  });

  it('sends telemetry events if the period elapsed', async () => {
    const watcher: Watcher = new Watcher(options);
    clearInterval(watcher.interval); // disable the timer

    // add some events that are due to be sent
    for (let i = 0; i < 10; i++) {
      watcher.batchedTelemetry.push({
        telemetryName: 'scan:complete',
        scanResults: blankScanResults,
        msElapsed: 10,
        msInserted: Date.now() - watcher.sendPeriodMilliseconds - 1,
      });
    }
    watcher.sendScanResultsTelemetryInABatch();
    expect(watcher.batchedTelemetry.length).toBe(0); // they were all sent
  });  

});
