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
exports.Git = exports.GitState = void 0;
const os_1 = require("os");
const crypto_1 = require("crypto");
const os = __importStar(require("os"));
const read_pkg_up_1 = require("read-pkg-up");
const applicationinsights_1 = require("applicationinsights");
const conf_1 = __importDefault(require("conf"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const exec = (0, util_1.promisify)(child_process_1.exec);
const { name, version } = (() => {
    var _a;
    const result = (_a = (0, read_pkg_up_1.sync)({ cwd: __dirname })) === null || _a === void 0 ? void 0 : _a.packageJson;
    if (!result)
        throw 'cannot find package.json';
    return result;
})();
const config = new conf_1.default({
    projectName: '@appland/appmap',
    projectVersion: '0.0.1', // note this is actually config version
});
const invalidMacAddresses = new Set([
    '00:00:00:00:00:00',
    'ff:ff:ff:ff:ff:ff',
    'ac:de:48:00:11:22',
]);
// This key is meant to be publically shared. However, I'm adding a simple
// obfuscation to mitigate key scraping bots on GitHub. The key is split on
// hypens and base64 encoded without padding.
// key.split('-').map((x) => x.toString('base64').replace(/=*/, ''))
const INSTRUMENTATION_KEY = ['NTBjMWE1YzI', 'NDliNA', 'NDkxMw', 'YjdjYw', 'ODZhNzhkNDA3NDVm']
    .map((x) => Buffer.from(x, 'base64').toString('utf8'))
    .join('-');
function getMachineId() {
    const machineId = config.get('machineId');
    if (machineId) {
        return machineId;
    }
    let machineIdSource;
    // Derive a machine ID from the first network interface
    machineIdSource = Object.values((0, os_1.networkInterfaces)())
        .flat()
        .map((iface) => iface === null || iface === void 0 ? void 0 : iface.mac)
        .filter((mac) => mac && !invalidMacAddresses.has(mac))
        .shift();
    if (!machineIdSource) {
        // Fallback to a random string
        machineIdSource = (0, crypto_1.randomBytes)(32);
    }
    const machineIdHash = (0, crypto_1.createHash)('sha256')
        .update(machineIdSource)
        .digest('hex');
    config.set('machineId', machineIdHash);
    return machineIdHash;
}
class Session {
    constructor() {
        const sessionId = config.get('sessionId');
        const sessionExpiration = config.get('sessionExpiration');
        if (sessionId && sessionExpiration && !Session.beyondExpiration(sessionExpiration)) {
            this.id = sessionId;
            this.expiration = sessionExpiration;
        }
        else {
            this.id = Session.newSessionId();
            this.expiration = Session.expirationFromNow();
            config.set('sessionId', this.id);
            config.set('sessionExpiration', this.expiration);
        }
    }
    static beyondExpiration(expiration) {
        return expiration <= Date.now();
    }
    static expirationFromNow() {
        return Date.now() + 1000 * 60 * 30;
    }
    static newSessionId() {
        return (0, crypto_1.createHash)('sha256').update((0, crypto_1.randomBytes)(32)).digest('hex');
    }
    touch() {
        this.expiration = Session.expirationFromNow();
        config.set('sessionExpiration', this.expiration);
    }
    get valid() {
        return !Session.beyondExpiration(this.expiration);
    }
}
const propPrefix = name === '@appland/appmap' ? 'appmap.cli.' : name.replace('@', '').replace('/', '.') + '.';
/**
 * Append the prefix to the name of each property and drop undefined values
 */
const transformProps = (obj) => {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined)
            continue;
        if (k.includes('.')) {
            result[k] = v;
            continue;
        }
        const prefixedKey = k.startsWith(propPrefix) ? k : `${propPrefix}${k}`;
        result[prefixedKey] = v;
    }
    return result;
};
class Telemetry {
    static get enabled() {
        return process.env.APPMAP_TELEMETRY_DISABLED === undefined;
    }
    static get session() {
        var _a;
        if (!((_a = this._session) === null || _a === void 0 ? void 0 : _a.valid)) {
            this._session = new Session();
        }
        return this._session;
    }
    static get client() {
        if (!this._client) {
            // Do not allow Application Insights to try and collect additional metadata
            process.env.APPLICATION_INSIGHTS_NO_STATSBEAT = '1';
            // Disable everything we can, we don't any additional collection from Application Insights.
            (0, applicationinsights_1.setup)(INSTRUMENTATION_KEY)
                .setAutoCollectRequests(false)
                .setAutoCollectPerformance(false)
                .setAutoCollectExceptions(false)
                .setAutoCollectDependencies(false)
                .setAutoCollectHeartbeat(false)
                .setAutoDependencyCorrelation(false)
                .setAutoCollectConsole(false)
                .setInternalLogging(false, false)
                .setSendLiveMetrics(false)
                .setUseDiskRetryCaching(true);
            const client = new applicationinsights_1.TelemetryClient(INSTRUMENTATION_KEY);
            client.context.tags[client.context.keys.userId] = Telemetry.machineId;
            client.context.tags[client.context.keys.sessionId] = Telemetry.session.id;
            client.context.tags[client.context.keys.cloudRole] = name;
            client.setAutoPopulateAzureProperties(false);
            this._client = client;
        }
        return this._client;
    }
    static sendEvent(data, options = { includeEnvironment: false }) {
        try {
            const transformedProperties = transformProps(Object.assign({ version: version, args: process.argv.slice(1).join(' ') }, data.properties));
            const transformedMetrics = transformProps(data.metrics || {});
            const properties = Object.assign({ 'common.source': name, 'common.os': os.platform(), 'common.platformversion': os.release(), 'common.arch': os.arch(), 'appmap.cli.machineId': Telemetry.machineId, 'appmap.cli.sessionId': Telemetry.session.id }, transformedProperties);
            if (options.includeEnvironment) {
                properties['common.environmentVariables'] = Object.keys(process.env).sort().join(',');
            }
            const event = {
                name: `${name}/${data.name}`,
                measurements: transformedMetrics,
                properties,
            };
            if (this.debug) {
                console.log(JSON.stringify(event, null, 2));
            }
            if (this.enabled) {
                Telemetry.client.trackEvent(event);
                Telemetry.session.touch();
                Telemetry.client.flush();
            }
        }
        catch (e) {
            // Don't let telemetry fail the entire command
            // Do nothing other than log for now, we can't do anything about it
            if (this.debug) {
                if (e instanceof Error) {
                    console.error(e.stack);
                }
                else {
                    console.error(e);
                }
            }
        }
    }
    static flush(exitCB) {
        if (this.enabled) {
            // Telemetry.client.flush is broken:
            // https://github.com/microsoft/ApplicationInsights-node.js/issues/871 .
            // As a result, we can fail to send telemetry data when exiting.
            //
            // If we got passed a callback, flush the data and wait for a second
            // before calling it.
            if (exitCB) {
                Telemetry.client.flush();
                setTimeout(exitCB, 1000);
            }
        }
        else {
            exitCB();
        }
    }
}
exports.default = Telemetry;
Telemetry.debug = process.env.APPMAP_TELEMETRY_DEBUG !== undefined;
Telemetry.machineId = getMachineId();
var GitState;
(function (GitState) {
    GitState[GitState["NotInstalled"] = 0] = "NotInstalled";
    GitState[GitState["NoRepository"] = 1] = "NoRepository";
    GitState[GitState["Ok"] = 2] = "Ok";
})(GitState = exports.GitState || (exports.GitState = {}));
class GitProperties {
    static contributors(sinceDaysAgo, cwd) {
        return __awaiter(this, void 0, void 0, function* () {
            const unixTimeNow = Math.floor(Number(new Date()) / 1000);
            const unixTimeAgo = unixTimeNow - sinceDaysAgo * 24 * 60 * 60;
            try {
                const { stdout } = yield exec([
                    'git',
                    cwd && `-C ${cwd.toString()}`,
                    '--no-pager',
                    'log',
                    `--since=${unixTimeAgo}`,
                    '--format="%ae"',
                ].join(' '));
                return [
                    ...stdout
                        .trim()
                        .split('\n')
                        .reduce((acc, email) => {
                        acc.add(email);
                        return acc;
                    }, new Set()),
                ];
            }
            catch (_a) {
                return [];
            }
        });
    }
    static state(cwd) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                try {
                    const commandProcess = (0, child_process_1.spawn)('git', ['status', '--porcelain'], {
                        shell: true,
                        cwd: cwd === null || cwd === void 0 ? void 0 : cwd.toString(),
                        stdio: 'ignore',
                        timeout: 2000,
                    });
                    commandProcess.on('exit', (code) => {
                        switch (code) {
                            case 127:
                                return resolve(GitState.NotInstalled);
                            case 128:
                                return resolve(GitState.NoRepository);
                            default:
                                return resolve(GitState.Ok);
                        }
                    });
                    commandProcess.on('error', () => resolve(GitState.NotInstalled));
                }
                catch (_a) {
                    resolve(GitState.NotInstalled);
                }
            });
        });
    }
}
const gitCache = new Map();
// GitProperties is available externally as Git.
// This export provides a simple caching layer around GitProperties to avoid
// excessive shelling out to git.
exports.Git = new Proxy(GitProperties, {
    get(target, prop) {
        if (typeof target[prop] === 'function') {
            return new Proxy(target[prop], {
                apply(target, thisArg, argArray) {
                    const cacheKey = `${prop.toString()}(${JSON.stringify(argArray)})`;
                    if (gitCache.has(cacheKey)) {
                        return gitCache.get(cacheKey);
                    }
                    /* eslint-disable-next-line @typescript-eslint/ban-types */
                    const result = Reflect.apply(target, thisArg, argArray);
                    if (result instanceof Promise) {
                        return result.then((r) => {
                            gitCache.set(cacheKey, r);
                            return r;
                        });
                    }
                    return result;
                },
            });
        }
        return Reflect.get(target, prop);
    },
});
