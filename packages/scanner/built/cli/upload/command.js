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
const util_1 = require("../../rules/lib/util");
const appmapDirFromConfig_1 = require("../appmapDirFromConfig");
const validateFile_1 = __importDefault(require("../validateFile"));
const resolveAppId_1 = __importDefault(require("../resolveAppId"));
const reportUploadURL_1 = __importDefault(require("../reportUploadURL"));
const upload_1 = __importDefault(require("../upload"));
const codeVersionArgs_1 = __importDefault(require("../codeVersionArgs"));
const errors_1 = require("../../errors");
const handleWorkingDirectory_1 = require("../handleWorkingDirectory");
exports.default = {
    command: 'upload',
    describe: 'Upload Findings to the AppMap Server',
    builder(args) {
        (0, codeVersionArgs_1.default)(args);
        args.option('directory', {
            describe: 'program working directory',
            type: 'string',
            alias: 'd',
        });
        args.option('appmap-dir', {
            describe: 'base directory of AppMaps',
        });
        args.option('report-file', {
            describe: 'file containing the findings report',
            default: 'appmap-findings.json',
        });
        args.option('app', {
            describe: 'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
        });
        args.option('merge-key', {
            describe: 'build job identifier. This is used to merge findings from parallelized scans',
        });
        return args.strict();
    },
    handler(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let { appmapDir } = options;
            const { verbose: isVerbose, directory, reportFile, app: appIdArg, mergeKey, branch, commit, environment, } = options;
            if (isVerbose) {
                (0, util_1.verbose)(true);
            }
            (0, handleWorkingDirectory_1.handleWorkingDirectory)(directory);
            if (!appmapDir) {
                appmapDir = yield (0, appmapDirFromConfig_1.appmapDirFromConfig)();
            }
            if (!appmapDir)
                throw new errors_1.ValidationError('appmapDir must be provided as a command option, or available in appmap.yml');
            yield (0, validateFile_1.default)('directory', appmapDir);
            const appId = yield (0, resolveAppId_1.default)(appIdArg, appmapDir);
            const scanResults = JSON.parse((yield (0, promises_1.readFile)(reportFile)).toString());
            const uploadResponse = yield (0, upload_1.default)(scanResults, appId, appmapDir, mergeKey, { branch, commit, environment }, {
                maxRetries: 3,
            });
            (0, reportUploadURL_1.default)(uploadResponse.summary.numFindings, uploadResponse.url);
        });
    },
};
