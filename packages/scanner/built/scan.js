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
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
const lru_cache_1 = __importDefault(require("lru-cache"));
const assert_1 = __importDefault(require("assert"));
const promises_1 = require("fs/promises");
const console_1 = require("console");
const models_1 = require("@appland/models");
const configurationProvider_1 = require("./configuration/configurationProvider");
const util_1 = require("./rules/lib/util");
const ruleChecker_1 = __importDefault(require("./ruleChecker"));
const appMapIndex_1 = __importDefault(require("./appMapIndex"));
const ConfigurationByFileName = new lru_cache_1.default({ max: 10 });
const ChecksByFileName = new lru_cache_1.default({ max: 10 });
class StatsProgressReporter {
    constructor() {
        this.parseTime = new Array();
        this.elapsedByRuleId = new Map();
    }
    printSummary() {
        if (!(0, util_1.verbose)())
            return;
        if (this.parseTime.length === 0)
            return;
        const keys = Array.from(this.elapsedByRuleId.keys()).sort();
        console.warn(`Average parse time: ${this.parseTime.reduce((memo, val) => memo + val, 0) / this.parseTime.length}ms`);
        for (const key of keys) {
            const elapsed = this.elapsedByRuleId.get(key);
            const average = elapsed.reduce((memo, val) => memo + val, 0) / elapsed.length;
            console.warn(`Average check time for ${key}: ${average}ms`);
        }
    }
    addParseTime(elapsed) {
        this.parseTime.push(elapsed);
    }
    beginAppMap(appMapFileName, appMap) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    beginCheck(check) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ruleId = check.rule.id;
            this.checkStartTime = new Date();
        });
    }
    filterScope(scopeName, scope) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    enterScope(scope) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    filterEvent(event) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    matchResult(event, matchResult) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    matchEvent(event, appMapIndex) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    leaveScope() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    endCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            (0, assert_1.default)(this.ruleId);
            (0, assert_1.default)(this.checkStartTime);
            const checkEndTime = new Date();
            const elapsed = checkEndTime.getTime() - this.checkStartTime.getTime();
            if (!this.elapsedByRuleId.has(this.ruleId))
                this.elapsedByRuleId.set(this.ruleId, []);
            this.elapsedByRuleId.get(this.ruleId).push(elapsed);
        });
    }
    endAppMap() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
const STATS_REPORTER = new StatsProgressReporter();
setInterval(() => STATS_REPORTER.printSummary(), 3000);
/**
 * Perform all configured checks on a single AppMap file.
 */
function scan(appmapFile, configurationFile) {
    return __awaiter(this, void 0, void 0, function* () {
        let configuration = ConfigurationByFileName.get(configurationFile);
        if (!configuration) {
            if ((0, util_1.verbose)())
                (0, console_1.warn)(`Loading configuration from ${configurationFile}`);
            configuration = yield (0, configurationProvider_1.parseConfigFile)(configurationFile);
            ConfigurationByFileName.set(configurationFile, configuration);
        }
        let checkImpls = ChecksByFileName.get(configurationFile);
        if (!checkImpls) {
            if ((0, util_1.verbose)())
                (0, console_1.warn)(`[scan] Loading checks from ${configurationFile}`);
            checkImpls = yield (0, configurationProvider_1.loadConfig)(configuration);
            ChecksByFileName.set(configurationFile, checkImpls);
        }
        const checker = new ruleChecker_1.default(STATS_REPORTER);
        const findings = [];
        const startTime = new Date();
        const appMapData = yield (0, promises_1.readFile)(appmapFile, 'utf8');
        const appMap = (0, models_1.buildAppMap)(appMapData).normalize().build();
        const parseTime = new Date();
        STATS_REPORTER.addParseTime(parseTime.getTime() - startTime.getTime());
        if ((0, util_1.verbose)())
            console.warn(`[scan] Event count: ${appMap.events.length}`);
        if ((0, util_1.verbose)())
            console.warn(`[scan] Parse time: ${parseTime.getTime() - startTime.getTime()}ms`);
        const appMapIndex = new appMapIndex_1.default(appMap);
        for (const check of checkImpls) {
            yield STATS_REPORTER.beginCheck(check);
            yield checker.check(appmapFile, appMapIndex, check, findings);
            yield STATS_REPORTER.endCheck();
        }
        const scanTime = new Date();
        if ((0, util_1.verbose)())
            console.warn(`[scan] Scan time: ${scanTime.getTime() - parseTime.getTime()}ms`);
        const checks = checkImpls.map((check) => ({
            id: check.id,
            scope: check.rule.scope || 'command',
            impactDomain: check.rule.impactDomain || 'Stability',
            rule: {
                id: check.rule.id,
                title: check.rule.title,
                description: check.rule.description,
                url: check.rule.url,
                labels: check.rule.labels || [],
                enumerateScope: check.rule.enumerateScope,
                references: check.rule.references || {},
            },
        }));
        return {
            configuration,
            appMapMetadata: { appmapFile: appMap.metadata },
            findings,
            checks,
        };
    });
}
exports.default = scan;
