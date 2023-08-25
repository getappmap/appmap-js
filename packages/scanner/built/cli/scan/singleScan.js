"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const scanner_1 = __importDefault(require("./scanner"));
const errors_1 = require("../../errors");
const findings_1 = require("../../findings");
const findingsReport_1 = __importDefault(require("../../report/findingsReport"));
const summaryReport_1 = __importDefault(require("../../report/summaryReport"));
const formatReport_1 = require("./formatReport");
const telemetry_1 = __importDefault(require("../../telemetry"));
const scanResults_1 = require("../../report/scanResults");
const util_1 = require("../../rules/lib/util");
const validateFile_1 = __importDefault(require("../validateFile"));
function singleScan(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { appmapFile, appmapDir, configuration, reportAllFindings, appId, ide, reportFile } = options;
        telemetry_1.default.sendEvent({
            name: 'scan:started',
            properties: {
                ide,
            },
        });
        const skipErrors = appmapDir !== undefined;
        const files = yield (0, util_1.collectAppMapFiles)(appmapFile, appmapDir);
        yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () { return (0, validateFile_1.default)('file', file); })));
        const scanner = yield (0, scanner_1.default)(reportAllFindings, configuration, files).catch((error) => {
            throw new errors_1.ValidationError(error.message + '\nUse --all to perform an offline scan.');
        });
        const startTime = Date.now();
        const [rawScanResults, findingStatuses] = yield Promise.all([
            scanner.scan(skipErrors),
            scanner.fetchFindingStatus(appId, appmapDir),
        ]);
        // Always report the raw data
        yield (0, promises_1.writeFile)(reportFile, (0, formatReport_1.formatReport)(rawScanResults));
        let scanResults;
        if (reportAllFindings) {
            scanResults = rawScanResults;
        }
        else {
            scanResults = rawScanResults.withFindings((0, findings_1.newFindings)(rawScanResults.findings, findingStatuses));
        }
        (0, findingsReport_1.default)(scanResults.findings, scanResults.appMapMetadata, ide);
        console.log();
        (0, summaryReport_1.default)(scanResults, true);
        console.log('\n');
        const elapsed = Date.now() - startTime;
        const numChecks = scanResults.checks.length * scanResults.summary.numAppMaps;
        console.log(`Performed ${numChecks} checks in ${elapsed}ms (${Math.floor(numChecks / (elapsed / 1000.0))} checks/sec)`);
        (0, scanResults_1.sendScanResultsTelemetry)({
            ruleIds: scanResults.summary.rules,
            numAppMaps: scanResults.summary.numAppMaps,
            numFindings: scanResults.summary.numFindings,
            elapsedMs: elapsed,
            appmapDir: options.appmapDir,
        });
    });
}
exports.default = singleScan;
