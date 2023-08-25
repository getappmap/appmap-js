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
const glob_1 = require("glob");
const promises_1 = require("fs/promises");
const util_1 = require("util");
const configurationProvider_1 = require("../../configuration/configurationProvider");
const errors_1 = require("../../errors");
const util_2 = require("../../rules/lib/util");
const appmapDirFromConfig_1 = require("../appmapDirFromConfig");
const findings_1 = require("../../findings");
const findingsReport_1 = __importDefault(require("../../report/findingsReport"));
const summaryReport_1 = __importDefault(require("../../report/summaryReport"));
const resolveAppId_1 = __importDefault(require("../resolveAppId"));
const validateFile_1 = __importDefault(require("../validateFile"));
const upload_1 = __importDefault(require("../upload"));
const scanner_1 = __importDefault(require("../scan/scanner"));
const scanArgs_1 = __importDefault(require("../scanArgs"));
const updateCommitStatus_1 = __importDefault(require("../updateCommitStatus"));
const reportUploadURL_1 = __importDefault(require("../reportUploadURL"));
const fail_1 = __importDefault(require("../fail"));
const codeVersionArgs_1 = __importDefault(require("../codeVersionArgs"));
const handleWorkingDirectory_1 = require("../handleWorkingDirectory");
exports.default = {
    command: 'ci',
    describe: 'Scan AppMaps, report findings to AppMap Server, and update SCM status',
    builder(args) {
        (0, scanArgs_1.default)(args);
        (0, codeVersionArgs_1.default)(args);
        args.option('fail', {
            describe: 'exit with non-zero status if there are any new findings',
            default: false,
            type: 'boolean',
        });
        args.option('update-commit-status', {
            describe: 'update commit status in SCM system',
            default: false,
            type: 'boolean',
        });
        args.option('upload', {
            describe: 'upload findings to AppMap server',
            default: true,
            type: 'boolean',
        });
        args.option('merge-key', {
            describe: 'build job identifier. This is used to merge findings from parallelized scans',
        });
        return args.strict();
    },
    handler(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let { appmapDir } = options;
            const { config, verbose: isVerbose, fail: failOption, app: appIdArg, directory, reportFile, upload: doUpload, updateCommitStatus: updateCommitStatusOption, mergeKey, commit, branch, environment, } = options;
            if (isVerbose) {
                (0, util_2.verbose)(true);
            }
            (0, handleWorkingDirectory_1.handleWorkingDirectory)(directory);
            if (!appmapDir) {
                appmapDir = yield (0, appmapDirFromConfig_1.appmapDirFromConfig)();
            }
            if (!appmapDir)
                throw new errors_1.ValidationError('appmapDir must be provided as a command option, or available in appmap.yml');
            yield (0, validateFile_1.default)('directory', appmapDir);
            const appId = yield (0, resolveAppId_1.default)(appIdArg, appmapDir);
            const glob = (0, util_1.promisify)(glob_1.glob);
            const files = yield glob(`${appmapDir}/**/*.appmap.json`);
            const configData = yield (0, configurationProvider_1.parseConfigFile)(config);
            const scanner = yield (0, scanner_1.default)(false, configData, files);
            const [rawScanResults, findingStatuses] = yield Promise.all([scanner.scan(), scanner.fetchFindingStatus(appIdArg, appmapDir)]);
            // Always report the raw data
            yield (0, promises_1.writeFile)(reportFile, JSON.stringify(rawScanResults, null, 2));
            const scanResults = rawScanResults.withFindings((0, findings_1.newFindings)(rawScanResults.findings, findingStatuses));
            (0, findingsReport_1.default)(scanResults.findings, scanResults.appMapMetadata);
            (0, summaryReport_1.default)(scanResults, true);
            if (doUpload) {
                const uploadResponse = yield (0, upload_1.default)(rawScanResults, appId, appmapDir, mergeKey, {
                    branch,
                    commit,
                    environment,
                }, {
                    maxRetries: 3,
                });
                (0, reportUploadURL_1.default)(uploadResponse.summary.numFindings, uploadResponse.url);
            }
            if (updateCommitStatusOption) {
                yield (0, updateCommitStatus_1.default)(scanResults.findings.length, scanResults.summary.numChecks);
            }
            if (failOption) {
                (0, fail_1.default)(scanResults.findings.length);
            }
        });
    },
};
