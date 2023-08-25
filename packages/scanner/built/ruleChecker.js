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
const models_1 = require("@appland/models");
const errors_1 = require("./errors");
const util_1 = require("./rules/lib/util");
const rootScope_1 = __importDefault(require("./scope/rootScope"));
const httpServerRequestScope_1 = __importDefault(require("./scope/httpServerRequestScope"));
const httpClientRequestScope_1 = __importDefault(require("./scope/httpClientRequestScope"));
const commandScope_1 = __importDefault(require("./scope/commandScope"));
const sqlTransactionScope_1 = __importDefault(require("./scope/sqlTransactionScope"));
const checkInstance_1 = __importDefault(require("./checkInstance"));
const eventUtil_1 = require("./eventUtil");
const hashV1_1 = __importDefault(require("./algorithms/hash/hashV1"));
const hashV2_1 = __importDefault(require("./algorithms/hash/hashV2"));
const path_1 = require("path");
const lastGitOrFSModifiedDate_1 = __importDefault(require("./lastGitOrFSModifiedDate"));
const console_1 = require("console");
const assert_1 = __importDefault(require("assert"));
function locationToFilePath(location) {
    const [file] = location.split(':');
    let filePath = file;
    if ((0, path_1.isAbsolute)(file) && file.startsWith(process.cwd())) {
        filePath = file.slice(process.cwd().length + 1);
    }
    return filePath;
}
class RuleChecker {
    constructor(progress) {
        this.progress = progress;
        this.scopes = {
            root: new rootScope_1.default(),
            command: new commandScope_1.default(),
            http_server_request: new httpServerRequestScope_1.default(),
            http_client_request: new httpClientRequestScope_1.default(),
            transaction: new sqlTransactionScope_1.default(),
        };
    }
    check(appMapFileName, appMapIndex, check, findings) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, util_1.verbose)()) {
                console.warn(`Checking AppMap ${appMapIndex.appMap.name} with scope ${check.scope}`);
            }
            const scopeIterator = this.scopes[check.scope];
            if (!scopeIterator) {
                throw new errors_1.AbortError(`Invalid scope name "${check.scope}"`);
            }
            const callEvents = function* () {
                const events = appMapIndex.appMap.events;
                for (let i = 0; i < events.length; i++) {
                    yield events[i];
                }
            };
            for (const scope of scopeIterator.scopes(callEvents())) {
                if ((0, util_1.verbose)()) {
                    console.warn(`Scope ${scope.scope}`);
                }
                if (this.progress)
                    yield this.progress.filterScope(check.scope, scope.scope);
                const checkInstance = new checkInstance_1.default(check);
                if (!check.filterScope(scope.scope, appMapIndex)) {
                    continue;
                }
                if (this.progress)
                    yield this.progress.enterScope(scope.scope);
                if (checkInstance.enumerateScope) {
                    for (const event of scope.events()) {
                        yield this.checkEvent(event, scope.scope, appMapFileName, appMapIndex, checkInstance, findings);
                    }
                }
                else {
                    yield this.checkEvent(scope.scope, scope.scope, appMapFileName, appMapIndex, checkInstance, findings);
                }
                if (this.progress)
                    yield this.progress.leaveScope();
            }
        });
    }
    checkEvent(event, scope, appMapFileName, appMapIndex, checkInstance, findings) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!event.isCall()) {
                return;
            }
            if ((0, util_1.verbose)()) {
                console.warn(`Asserting ${checkInstance.ruleId} on ${event.codeObject.fqid} event ${event.toString()}`);
            }
            if (!event.returnEvent) {
                if ((0, util_1.verbose)()) {
                    console.warn(`\tEvent has no returnEvent. Skipping.`);
                }
                return;
            }
            if (this.progress)
                yield this.progress.filterEvent(event);
            if (!checkInstance.filterEvent(event, appMapIndex)) {
                return;
            }
            let appmapConfigDir;
            {
                let searchDir = (0, path_1.dirname)((0, path_1.resolve)(appMapFileName));
                while (!appmapConfigDir) {
                    if (yield (0, util_1.fileExists)((0, path_1.join)(searchDir, 'appmap.yml'))) {
                        appmapConfigDir = searchDir;
                    }
                    else {
                        if ((0, path_1.dirname)(searchDir) === searchDir)
                            break;
                        searchDir = (0, path_1.dirname)(searchDir);
                    }
                }
            }
            const resolvePath = (path) => __awaiter(this, void 0, void 0, function* () {
                const candidates = [path];
                if (appmapConfigDir)
                    candidates.push((0, path_1.join)(appmapConfigDir, path));
                for (const candidate of candidates)
                    if (yield (0, util_1.fileExists)(candidate))
                        return candidate;
            });
            const mostRecentModifiedDate = (filePaths) => __awaiter(this, void 0, void 0, function* () {
                const dates = new Array();
                for (const filePath of filePaths) {
                    const resolvedPath = yield resolvePath(filePath);
                    if (!resolvedPath)
                        continue;
                    const date = yield (0, lastGitOrFSModifiedDate_1.default)(resolvedPath);
                    if (date)
                        dates.push(date);
                }
                return dates.sort((a, b) => (a && b ? b.getTime() - a.getTime() : 0))[0];
            });
            const buildFinding = (matchEvent, participatingEvents, message, groupMessage, occurranceCount, 
            // matchEvent will be added to additionalEvents and participatingEvents.values
            // to create the relatedEvents array
            additionalEvents) => __awaiter(this, void 0, void 0, function* () {
                const findingEvent = matchEvent || event;
                // Fixes:
                // TypeError: Cannot read property 'forEach' of undefined
                //   at hashHttp (/Users/kgilpin/source/appland/scanner/node_modules/@appland/models/dist/index.cjs:1663:11)
                //   at hashEvent (/Users/kgilpin/source/appland/scanner/node_modules/@appland/models/dist/index.cjs:1714:14)
                //   at Event.get hash [as hash] (/Users/kgilpin/source/appland/scanner/node_modules/@appland/models/dist/index.cjs:3325:27)
                findingEvent.message || (findingEvent.message = []);
                const stack = [
                    findingEvent.codeObject.location,
                    ...findingEvent.ancestors().map((ancestor) => ancestor.codeObject.location),
                ].filter(Boolean);
                const hashV1 = new hashV1_1.default(checkInstance.ruleId, findingEvent, 
                // findingEvent gets passed here as a relatedEvent, and if you look at HashV1 it
                // gets added to the hash again. That's how it worked in V1 so it's here for compatibility.
                additionalEvents || []);
                let scopeModifiedDate;
                {
                    const scopeNavigator = new models_1.EventNavigator(scope);
                    const scopeFiles = new Set();
                    const collectScope = (event) => {
                        if (!event.codeObject.location)
                            return;
                        const filePath = locationToFilePath(event.codeObject.location);
                        if (!filePath)
                            return;
                        scopeFiles.add(filePath);
                    };
                    collectScope(scope);
                    for (const descendant of scopeNavigator.descendants()) {
                        const { event } = descendant;
                        collectScope(event);
                    }
                    const localScopeFiles = [...scopeFiles].filter((filePath) => ((0, assert_1.default)(filePath), !(0, path_1.isAbsolute)(filePath)));
                    scopeModifiedDate = yield mostRecentModifiedDate(localScopeFiles);
                }
                const hashV2 = new hashV2_1.default(checkInstance.ruleId, findingEvent, participatingEvents);
                const uniqueEvents = new Set();
                const relatedEvents = [];
                const relatedEventFiles = new Set();
                const collectEventFile = (event) => {
                    if (!event.codeObject.location)
                        return;
                    const filePath = locationToFilePath(event.codeObject.location);
                    if (!filePath)
                        return;
                    if ((0, path_1.isAbsolute)(filePath))
                        return;
                    relatedEventFiles.add(filePath);
                };
                [findingEvent, ...(additionalEvents || []), ...Object.values(participatingEvents)].forEach((event) => {
                    if (uniqueEvents.has(event.id)) {
                        return;
                    }
                    collectEventFile(event);
                    for (const ancestor of new models_1.EventNavigator(event).ancestors()) {
                        collectEventFile(ancestor.event);
                    }
                    uniqueEvents.add(event.id);
                    relatedEvents.push((0, eventUtil_1.cloneEvent)(event));
                });
                const eventsModifiedDate = yield mostRecentModifiedDate([...relatedEventFiles]);
                if ((0, util_1.verbose)()) {
                    (0, console_1.warn)(`Scope modified date: ${scopeModifiedDate}`);
                    (0, console_1.warn)(`Events modified date: ${eventsModifiedDate}`);
                }
                return {
                    appMapFile: appMapFileName,
                    checkId: checkInstance.checkId,
                    ruleId: checkInstance.ruleId,
                    ruleTitle: checkInstance.title,
                    event: (0, eventUtil_1.cloneEvent)(findingEvent),
                    hash: hashV1.digest(),
                    hash_v2: hashV2.digest(),
                    stack,
                    scope: (0, eventUtil_1.cloneEvent)(scope),
                    message: message || checkInstance.title,
                    groupMessage,
                    occurranceCount,
                    relatedEvents: relatedEvents.sort((event) => event.id),
                    impactDomain: checkInstance.checkImpactDomain,
                    participatingEvents: Object.fromEntries(Object.entries(participatingEvents).map(([k, v]) => [k, (0, eventUtil_1.cloneEvent)(v)])),
                    scopeModifiedDate,
                    eventsModifiedDate,
                };
            });
            if (this.progress)
                yield this.progress.matchEvent(event, appMapIndex);
            const matchResult = yield checkInstance.ruleLogic.matcher(event, appMapIndex, checkInstance.filterEvent.bind(checkInstance));
            if (this.progress)
                yield this.progress.matchResult(event, matchResult);
            const numFindings = findings.length;
            if (matchResult === true) {
                let finding;
                if (checkInstance.ruleLogic.message) {
                    const message = checkInstance.ruleLogic.message(scope, event);
                    finding = yield buildFinding(event, {}, message);
                }
                else {
                    finding = yield buildFinding(event, {});
                }
                findings.push(finding);
            }
            else if (typeof matchResult === 'string') {
                const finding = yield buildFinding(event, {}, matchResult);
                finding.message = matchResult;
                findings.push(finding);
            }
            else if (matchResult) {
                for (const mr of matchResult) {
                    const finding = yield buildFinding(mr.event, mr.participatingEvents || {}, mr.message, mr.groupMessage, mr.occurranceCount, mr.relatedEvents);
                    findings.push(finding);
                }
            }
            if ((0, util_1.verbose)()) {
                if (findings.length > numFindings) {
                    findings.forEach((finding) => console.log(`\tFinding: ${finding.ruleId} : ${finding.message}`));
                }
            }
        });
    }
}
exports.default = RuleChecker;
