import EventEmitter from 'events';
import Sinon from 'sinon';
import * as watchScanTelemetry from '../../src/cli/scan/watchScanTelemetry';
import { MaxMSBetween } from '../../src/lib/eventAggregator';
import * as scanSummary from '../../src/report/scanSummary';
import * as scanResults from '../../src/report/scanResults';
import assert from 'assert';

const ScanEvents: watchScanTelemetry.ScanEvent[] = [
  {
    scanResults: {
      summary: {
        appMapMetadata: {} as unknown as scanSummary.AppMapMetadata,
        numAppMaps: 10,
        rules: ['a', 'b'],
        numChecks: 10,
        numFindings: 1,
        ruleLabels: [],
      } as scanSummary.ScanSummary,
    },
    elapsed: 5,
  } as watchScanTelemetry.ScanEvent,
  {
    scanResults: {
      summary: {
        appMapMetadata: {} as unknown as scanSummary.AppMapMetadata,
        numAppMaps: 12,
        rules: ['b', 'c'],
        numChecks: 113,
        numFindings: 2,
        ruleLabels: [],
      } as scanSummary.ScanSummary,
    },
    elapsed: 10,
  } as watchScanTelemetry.ScanEvent,
];

describe(watchScanTelemetry.WatchScanTelemetry, () => {
  let emitter: EventEmitter;
  let sinon: Sinon.SinonSandbox;
  let _telemetry: watchScanTelemetry.WatchScanTelemetry;
  let sendScanResultsTelemetry: Sinon.SinonStub;

  beforeEach(() => jest.useFakeTimers());
  beforeEach(() => (emitter = new EventEmitter()));
  beforeEach(() => (sinon = Sinon.createSandbox()));
  beforeEach(
    () => (sendScanResultsTelemetry = sinon.stub(scanResults, 'sendScanResultsTelemetry'))
  );
  beforeEach(() => (_telemetry = new watchScanTelemetry.WatchScanTelemetry(emitter)));

  afterEach(() => jest.useRealTimers());
  afterEach(() => sinon.restore());

  it('can be a nop', async () => {
    jest.advanceTimersByTime(MaxMSBetween * 1.5);

    assert(sendScanResultsTelemetry.notCalled, 'No telemetry should be sent');
  });

  it('does not send telemetry events if the period has not elapsed', async () => {
    emitter.emit('scan', ScanEvents[0]);

    jest.advanceTimersByTime(MaxMSBetween / 2);

    assert(sendScanResultsTelemetry.notCalled, 'No telemetry should be sent');
  });

  it('sends telemetry events when the delay elapses', async () => {
    emitter.emit('scan', ScanEvents[0]);
    emitter.emit('scan', ScanEvents[1]);

    jest.advanceTimersByTime(MaxMSBetween * 1.5);

    assert(
      sendScanResultsTelemetry.calledOnce,
      'Expected sendScanResultsTelemetry to have been called once'
    );
    assert.deepEqual(sendScanResultsTelemetry.firstCall.args, [
      { elapsedMs: 15, numAppMaps: 22, numFindings: 3, ruleIds: ['a', 'b', 'c'] },
    ]);
  });

  it('batches telemetry events when there is a long delay', async () => {
    emitter.emit('scan', ScanEvents[0]);
    jest.advanceTimersByTime(MaxMSBetween * 1.5);

    emitter.emit('scan', ScanEvents[1]);
    jest.advanceTimersByTime(MaxMSBetween * 1.5);

    assert(
      sendScanResultsTelemetry.calledTwice,
      'Expected sendScanResultsTelemetry to have been called twice'
    );
    assert.deepEqual(sendScanResultsTelemetry.firstCall.args, [
      { elapsedMs: 5, numAppMaps: 10, numFindings: 1, ruleIds: ['a', 'b'] },
    ]);
    assert.deepEqual(sendScanResultsTelemetry.secondCall.args, [
      { elapsedMs: 10, numAppMaps: 12, numFindings: 2, ruleIds: ['b', 'c'] },
    ]);
  });
});
