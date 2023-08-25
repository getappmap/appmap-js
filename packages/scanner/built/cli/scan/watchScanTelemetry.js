"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchScanTelemetry = void 0;
const eventAggregator_1 = __importDefault(require("../../util/eventAggregator"));
const scanResults_1 = require("../../report/scanResults");
class WatchScanTelemetry {
    constructor(scanEvents, appmapDir) {
        this.appmapDir = appmapDir;
        this.cancelFn = new eventAggregator_1.default((events) => {
            const scanEvents = events.map((e) => e.arg);
            this.sendTelemetry(scanEvents);
        }).attach(scanEvents, 'scan');
    }
    cancel() {
        if (this.cancelFn)
            this.cancelFn();
        this.cancelFn = undefined;
    }
    static watch(scanEvents, appmapDir) {
        const telemetry = new WatchScanTelemetry(scanEvents, appmapDir);
        return () => telemetry.cancel();
    }
    sendTelemetry(scanEvents) {
        const ruleIds = new Set();
        let elapsed = 0;
        const telemetryScanResults = new scanResults_1.ScanResults();
        for (const scanEvent of scanEvents) {
            telemetryScanResults.aggregate(scanEvent.scanResults);
            elapsed += scanEvent.elapsed;
        }
        telemetryScanResults.summary.rules.forEach((rule) => ruleIds.add(rule));
        (0, scanResults_1.sendScanResultsTelemetry)({
            ruleIds: [...ruleIds],
            numAppMaps: telemetryScanResults.summary.numAppMaps,
            numFindings: telemetryScanResults.summary.numFindings,
            elapsedMs: elapsed,
            appmapDir: this.appmapDir,
        });
    }
}
exports.WatchScanTelemetry = WatchScanTelemetry;
