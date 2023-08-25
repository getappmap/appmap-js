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
const util_1 = require("../../rules/lib/util");
const merge_1 = require("../../integration/appland/scannerJob/merge");
const resolveAppId_1 = __importDefault(require("../resolveAppId"));
const updateCommitStatus_1 = __importDefault(require("../updateCommitStatus"));
const fail_1 = __importDefault(require("../fail"));
exports.default = {
    command: 'merge <merge-key>',
    describe: 'Merge scan results from parallel scans',
    builder(args) {
        args.option('app', {
            describe: 'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
        });
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
        args.positional('merge-key', {
            describe: 'build job identifier. This is used to merge findings from parallelized scans',
            type: 'string',
        });
        return args.strict();
    },
    handler(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { verbose: isVerbose, app: appIdArg, fail: failOption, updateCommitStatus: updateCommitStatusOption, mergeKey, } = options;
            if (isVerbose) {
                (0, util_1.verbose)(true);
            }
            const appId = yield (0, resolveAppId_1.default)(appIdArg, '.');
            const mergeResults = yield (0, merge_1.merge)(appId, mergeKey);
            console.warn(`Merged results to ${mergeResults.url}`);
            if (updateCommitStatusOption) {
                yield (0, updateCommitStatus_1.default)(mergeResults.summary.numFindings, mergeResults.summary.numChecks);
            }
            if (failOption) {
                (0, fail_1.default)(mergeResults.summary.numFindings);
            }
        });
    },
};
