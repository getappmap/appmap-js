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
const cli_progress_1 = __importDefault(require("cli-progress"));
const promises_1 = require("fs/promises");
const models_1 = require("@appland/models");
const ruleChecker_1 = __importDefault(require("../ruleChecker"));
const appMapIndex_1 = __importDefault(require("../appMapIndex"));
const node_assert_1 = __importDefault(require("node:assert"));
function batch(items, size, process) {
    return __awaiter(this, void 0, void 0, function* () {
        const left = [...items];
        while (left.length)
            yield Promise.all(left.splice(0, size).map(process));
    });
}
class Progress {
    constructor(numFiles, numChecks) {
        this.numFiles = numFiles;
        this.numChecks = numChecks;
        this.checks = 0;
        if (process.stdout.isTTY)
            this.bar = new cli_progress_1.default.SingleBar({ format: `Scanning [{bar}] {percentage}% | {value}/{total}` }, cli_progress_1.default.Presets.shades_classic);
        else {
            this.start = this.check = this.file = this.stop = () => { };
        }
    }
    start() {
        var _a;
        (_a = this.bar) === null || _a === void 0 ? void 0 : _a.start(this.numFiles * this.numChecks, 0);
    }
    check() {
        var _a;
        this.checks += 1;
        (_a = this.bar) === null || _a === void 0 ? void 0 : _a.increment();
    }
    file() {
        var _a;
        (_a = this.bar) === null || _a === void 0 ? void 0 : _a.increment(this.numChecks - this.checks);
        this.checks = 0;
    }
    stop() {
        var _a;
        (_a = this.bar) === null || _a === void 0 ? void 0 : _a.stop();
    }
}
function scan(files, checks, skipErrors = true) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: Improve this by respecting .gitignore, or similar.
        // For now, this addresses the main problem of encountering appmap-js and its appmap.json files
        // in a bundled node_modules.
        files = files.filter((file) => !file.split('/').includes('node_modules'));
        const checker = new ruleChecker_1.default();
        const appMapMetadata = {};
        const findings = [];
        const progress = new Progress(files.length, checks.length);
        let lastError = null;
        let anySuccess = false;
        yield batch(files, 2, (file) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`scanning ${file}`);
                const appMapData = yield (0, promises_1.readFile)(file, 'utf8');
                const appMap = (0, models_1.buildAppMap)(appMapData).normalize().build();
                const appMapIndex = new appMapIndex_1.default(appMap);
                appMapMetadata[file] = appMap.metadata;
                yield Promise.all(checks.map((check) => __awaiter(this, void 0, void 0, function* () {
                    const matchCount = findings.length;
                    yield checker.check(file, appMapIndex, check, findings);
                    progress.check();
                    const newMatches = findings.slice(matchCount, findings.length);
                    newMatches.forEach((match) => (match.appMapFile = file));
                })));
                anySuccess = true;
            }
            catch (error) {
                (0, node_assert_1.default)(error instanceof Error);
                lastError = new Error(`Error processing "${file}"`, { cause: error });
                if (!skipErrors)
                    throw lastError;
                console.warn(lastError);
            }
            progress.file();
        }));
        progress.stop();
        if (!anySuccess && lastError)
            throw lastError;
        return { appMapMetadata, findings };
    });
}
exports.default = scan;
