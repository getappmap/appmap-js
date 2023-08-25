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
const errors_1 = require("../../errors");
const util_1 = require("../../rules/lib/util");
const appmapDirFromConfig_1 = require("../appmapDirFromConfig");
const validateFile_1 = __importDefault(require("../validateFile"));
const scanArgs_1 = __importDefault(require("../scanArgs"));
const resolveAppId_1 = __importDefault(require("../resolveAppId"));
const singleScan_1 = __importDefault(require("./singleScan"));
const watchScan_1 = __importDefault(require("./watchScan"));
const configurationProvider_1 = require("../../configuration/configurationProvider");
const handleWorkingDirectory_1 = require("../handleWorkingDirectory");
const interactiveScan_1 = __importDefault(require("./interactiveScan"));
exports.default = {
    command: 'scan',
    describe: 'Scan AppMaps for code behavior findings',
    builder(args) {
        (0, scanArgs_1.default)(args);
        args.option('interactive', {
            describe: 'scan in interactive mode',
            alias: 'i',
        });
        args.option('appmap-file', {
            describe: 'single file to scan, or repeat this option to scan multiple specific files',
            alias: 'f',
        });
        args.option('ide', {
            describe: 'choose your IDE protocol to open AppMaps directly in your IDE.',
            options: ['vscode', 'x-mine', 'idea', 'pycharm'],
        });
        args.option('all', {
            describe: 'report all findings, including duplicates of known findings',
            default: false,
            type: 'boolean',
        });
        args.option('watch', {
            describe: 'scan code changes and report findings on changed files',
            default: false,
            type: 'boolean',
        });
        return args.strict();
    },
    handler(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let { appmapDir } = options;
            const { appmapFile, directory, interactive, config: configFile, verbose: isVerbose, all: reportAllFindings, watch, app: appIdArg, apiKey, ide, reportFile, } = options;
            if (isVerbose) {
                (0, util_1.verbose)(true);
            }
            (0, handleWorkingDirectory_1.handleWorkingDirectory)(directory);
            if (apiKey) {
                process.env.APPLAND_API_KEY = apiKey;
            }
            if (appmapFile && watch) {
                throw new errors_1.ValidationError('Use --appmap-file or --watch, but not both');
            }
            if (reportAllFindings && watch) {
                throw new errors_1.ValidationError(`Don't use --all with --watch, because in watch mode all findings are reported`);
            }
            if (appmapDir)
                yield (0, validateFile_1.default)('directory', appmapDir);
            if (!appmapFile && !appmapDir) {
                appmapDir = (yield (0, appmapDirFromConfig_1.appmapDirFromConfig)()) || '.';
            }
            let appId = appIdArg;
            if (!watch && !reportAllFindings)
                appId = yield (0, resolveAppId_1.default)(appIdArg, appmapDir);
            if (watch) {
                const watchAppMapDir = appmapDir;
                return (0, watchScan_1.default)({ appId, appmapDir: watchAppMapDir, configFile });
            }
            else {
                const configuration = yield (0, configurationProvider_1.parseConfigFile)(configFile);
                if (interactive) {
                    return (0, interactiveScan_1.default)({
                        appmapFile,
                        appmapDir,
                        configuration,
                    });
                }
                else {
                    return (0, singleScan_1.default)({
                        appmapFile,
                        appmapDir,
                        configuration,
                        reportAllFindings,
                        appId,
                        ide,
                        reportFile,
                    });
                }
            }
        });
    },
};
