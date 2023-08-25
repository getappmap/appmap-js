"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendScanResultsTelemetry = exports.ScanResults = void 0;
const telemetry_1 = __importStar(require("../telemetry"));
class DistinctItems {
    constructor() {
        this.members = {};
    }
    push(...items) {
        for (const item of items) {
            if (item === undefined)
                continue;
            const key = JSON.stringify(item);
            if (!(key in this.members))
                this.members[key] = item;
        }
    }
    [Symbol.iterator]() {
        return Object.values(this.members)[Symbol.iterator]();
    }
}
function collectMetadata(metadata) {
    var _a, _b;
    const uniqueApps = new DistinctItems();
    const uniqueLabels = new DistinctItems();
    const uniqueClients = new DistinctItems();
    const uniqueFrameworks = new DistinctItems();
    const uniqueGit = new DistinctItems();
    const uniqueLanguages = new DistinctItems();
    const uniqueRecorders = new DistinctItems();
    const uniqueExceptions = new DistinctItems();
    for (const item of metadata) {
        uniqueApps.push(item.app);
        uniqueLabels.push(...((_a = item.labels) !== null && _a !== void 0 ? _a : []));
        uniqueClients.push(item.client);
        uniqueFrameworks.push(...((_b = item.frameworks) !== null && _b !== void 0 ? _b : []));
        uniqueGit.push(item.git);
        uniqueLanguages.push(item.language);
        uniqueRecorders.push(item.recorder);
        uniqueExceptions.push(item.exception);
    }
    return {
        labels: [...uniqueLabels],
        apps: [...uniqueApps],
        clients: [...uniqueClients],
        frameworks: [...uniqueFrameworks],
        git: [...uniqueGit],
        languages: [...uniqueLanguages],
        recorders: [...uniqueRecorders],
        testStatuses: [],
        exceptions: [...uniqueExceptions],
    };
}
/**
 * ScannerSummary summarizes the results of the entire scan.
 * It's used for printing a user-friendly summary report, it's not used for machine-readable program output.
 */
class ScanResults {
    constructor(configuration = { checks: [] }, appMapMetadata = {}, findings = [], checks = []) {
        this.configuration = configuration;
        this.appMapMetadata = appMapMetadata;
        this.findings = findings;
        this.checks = checks;
        this.summary = {
            numAppMaps: Object.keys(appMapMetadata).length,
            numChecks: checks.length * Object.keys(appMapMetadata).length,
            rules: [...new Set(checks.map((check) => check.rule.id))].sort(),
            ruleLabels: [...new Set(checks.map((check) => check.rule.labels || []).flat())].sort(),
            numFindings: findings.length,
            appMapMetadata: collectMetadata(Object.values(appMapMetadata)),
        };
    }
    withFindings(findings) {
        return new ScanResults(this.configuration, this.appMapMetadata, findings, this.checks);
    }
    aggregate(sourceScanResults) {
        this.summary.numAppMaps += sourceScanResults.summary.numAppMaps;
        this.summary.numChecks += sourceScanResults.summary.numChecks;
        this.summary.rules = [...new Set(this.summary.rules.concat(sourceScanResults.summary.rules))];
        this.summary.ruleLabels = [
            ...new Set(this.summary.ruleLabels.concat(sourceScanResults.summary.ruleLabels)),
        ];
        this.summary.numFindings += sourceScanResults.summary.numFindings;
        // we don't need sourceScanResults.summary.appMetadata
        // appMapMetadata.Git may also contain secrets we don't want to transmit.
    }
}
exports.ScanResults = ScanResults;
function sendScanResultsTelemetry(telemetry) {
    return __awaiter(this, void 0, void 0, function* () {
        const gitState = telemetry_1.GitState[yield telemetry_1.Git.state(telemetry.appmapDir)];
        const contributors = (yield telemetry_1.Git.contributors(60, telemetry.appmapDir)).length;
        telemetry_1.default.sendEvent({
            name: 'scan:completed',
            properties: {
                rules: telemetry.ruleIds.sort().join(', '),
                git_state: gitState,
            },
            metrics: {
                duration: telemetry.elapsedMs / 1000,
                numRules: telemetry.ruleIds.length,
                numAppMaps: telemetry.numAppMaps,
                numFindings: telemetry.numFindings,
                contributors: contributors,
            },
        }, { includeEnvironment: true });
    });
}
exports.sendScanResultsTelemetry = sendScanResultsTelemetry;
