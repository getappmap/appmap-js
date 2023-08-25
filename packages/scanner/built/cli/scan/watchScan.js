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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Watcher = void 0;
const promises_1 = require("fs/promises");
const chokidar = __importStar(require("chokidar"));
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const async_1 = require("async");
const node_util_1 = require("node:util");
const formatReport_1 = require("./formatReport");
const scanner_1 = __importDefault(require("./scanner"));
const configurationProvider_1 = require("../../configuration/configurationProvider");
const telemetry_1 = __importDefault(require("../../telemetry"));
const events_1 = __importDefault(require("events"));
const watchScanTelemetry_1 = require("./watchScanTelemetry");
const isAncestorPath_1 = __importDefault(require("../../util/isAncestorPath"));
const util_1 = require("util");
const debug = (0, util_1.debuglog)('scanner:watch');
function isDir(targetPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return (yield (0, promises_1.stat)(targetPath)).isDirectory();
        }
        catch (_a) {
            return false;
        }
    });
}
function existingParent(targetPath) {
    return __awaiter(this, void 0, void 0, function* () {
        while (targetPath.length > 1) {
            if (yield isDir(targetPath))
                break;
            targetPath = path_1.default.dirname(targetPath);
        }
        return targetPath;
    });
}
class Watcher {
    constructor(options) {
        this.options = options;
        this.scanEventEmitter = new events_1.default();
        // do not remove callbackify, apparently on windows
        // passing plain async function doesn't work (?)
        this.queue = (0, async_1.queue)((0, node_util_1.callbackify)(this.scan.bind(this)), 2);
        this.processing = new Set();
        watchScanTelemetry_1.WatchScanTelemetry.watch(this.scanEventEmitter, options.appmapDir);
        this.queue.error((error, task) => console.warn(`Problem processing ${task}:\n`, error));
    }
    watch() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.reloadConfig();
            telemetry_1.default.sendEvent({
                name: 'scan:started',
            });
            this.configWatcher = chokidar.watch(this.options.configFile, {
                ignoreInitial: true,
            });
            this.configWatcher
                .on('add', this.reloadConfig.bind(this))
                .on('change', this.reloadConfig.bind(this));
            const cwd = process.cwd();
            // note: sometimes path.resolve doesn't seem to use the correct cwd unless it's provided explicitly
            const appmapDir = path_1.default.resolve(cwd, this.options.appmapDir);
            // If the appmap directory is a descendant of cwd, watch cwd (presumably project directory).
            // This ensures the watch will survive even if the appmap dir is removed and recreated.
            // Otherwise, make sure to use an existing directory. Chokidar struggles with missing directories.
            const watchDir = (0, isAncestorPath_1.default)(cwd, appmapDir) ? cwd : yield existingParent(appmapDir);
            // Custom ignore function needed to cut down the watch tree to just what we need.
            const ignored = (targetPath) => {
                // Ignore anything that isn't an ancestor or descendant of the appmap dir.
                if (!((0, isAncestorPath_1.default)(targetPath, appmapDir) || (0, isAncestorPath_1.default)(appmapDir, targetPath)))
                    return true;
                // Also make sure to not try to recurse down node_modules or .git
                const basename = path_1.default.basename(targetPath);
                return basename === 'node_modules' || basename === '.git';
            };
            this.appmapWatcher = chokidar.watch(watchDir, {
                ignoreInitial: true,
                ignored,
                ignorePermissionErrors: true,
            });
            this.appmapPoller = chokidar.watch(watchDir, {
                ignoreInitial: false,
                ignored,
                usePolling: true,
                interval: 1000,
                persistent: false,
            });
            const enqueue = (filePath) => path_1.default.basename(filePath) === 'mtime' && this.enqueue(filePath);
            this.appmapPoller.on('add', enqueue).on('change', enqueue);
            this.appmapWatcher
                .on('add', enqueue)
                .on('change', enqueue)
                .on('error', this.watcherErrorFunction.bind(this));
        });
    }
    isError(error, code) {
        const err = error;
        return err.code === code;
    }
    watcherErrorFunction(error) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.appmapWatcher && this.isError(error, 'ENOSPC')) {
                console.warn(error.stack);
                console.warn('Will disable file watching. File polling will stay enabled.');
                yield ((_a = this.appmapWatcher) === null || _a === void 0 ? void 0 : _a.close());
                this.appmapWatcher = undefined;
                console.warn('File watching disabled.');
                telemetry_1.default.sendEvent({
                    name: `scan:watcher_error:enospc`,
                    properties: {
                        errorMessage: error.message,
                        errorStack: error.stack,
                    },
                });
            }
            else {
                // let it crash if it's some other error, to learn what the error is
                throw error;
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(['appmapWatcher', 'appmapPoller', 'configWatcher'].map((k) => {
                var _a;
                const closer = (_a = this[k]) === null || _a === void 0 ? void 0 : _a.close();
                this[k] = undefined;
                return closer;
            }));
        });
    }
    enqueue(mtimePath) {
        if (this.processing.has(mtimePath))
            return;
        this.processing.add(mtimePath);
        this.queue.push(mtimePath);
    }
    scan(mtimePath) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, assert_1.default)(this.config, `config should always be loaded before appmapWatcher triggers a scan`);
            const appmapFile = [path_1.default.dirname(mtimePath), 'appmap.json'].join('.');
            const reportFile = mtimePath.replace(/mtime$/, 'appmap-findings.json');
            const [appmapStats, reportStats] = yield Promise.all([appmapFile, reportFile].map((f) => (0, promises_1.stat)(f).catch(() => null)));
            if (!appmapStats)
                return;
            const cut = (str) => str.substring(str.length - 8);
            debug('%s: %s, findings: %s, config: %s', appmapFile, cut(appmapStats.mtimeMs.toFixed(3)), reportStats && cut(reportStats.mtimeMs.toFixed(3)), cut(this.config.timestampMs.toFixed(3)));
            if (reportStats &&
                reportStats.mtimeMs > appmapStats.mtimeMs - 1000 &&
                reportStats.mtimeMs > this.config.timestampMs - 1000)
                return; // report is up to date
            const startTime = Date.now();
            const scanner = yield (0, scanner_1.default)(true, this.config, [appmapFile]);
            const rawScanResults = yield scanner.scan();
            const elapsed = Date.now() - startTime;
            this.scanEventEmitter.emit('scan', { scanResults: rawScanResults, elapsed });
            // Always report the raw data
            yield (0, promises_1.writeFile)(reportFile, (0, formatReport_1.formatReport)(rawScanResults));
            this.processing.delete(mtimePath);
        });
    }
    reloadConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            this.config = yield (0, configurationProvider_1.parseConfigFile)(this.options.configFile);
        });
    }
}
exports.Watcher = Watcher;
function watchScan(options) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Watcher(options).watch();
    });
}
exports.default = watchScan;
