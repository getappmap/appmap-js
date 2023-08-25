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
const src_1 = require("@appland/client/dist/src");
const configurationProvider_1 = require("../../configuration/configurationProvider");
const resolveAppId_1 = __importDefault(require("../resolveAppId"));
const scan_1 = __importDefault(require("../scan"));
const scanResults_1 = require("../../report/scanResults");
function scanner(reportAllFindings, configuration, files) {
    return __awaiter(this, void 0, void 0, function* () {
        if (reportAllFindings) {
            return new StandaloneScanner(configuration, files);
        }
        else {
            yield (0, src_1.loadConfiguration)();
            return new ServerIntegratedScanner(configuration, files);
        }
    });
}
exports.default = scanner;
class ScannerBase {
    constructor(configuration, files) {
        this.configuration = configuration;
        this.files = files;
    }
    scan(skipErrors = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const checks = yield (0, configurationProvider_1.loadConfig)(this.configuration);
            const { appMapMetadata, findings } = yield (0, scan_1.default)(this.files, checks, skipErrors);
            return new scanResults_1.ScanResults(this.configuration, appMapMetadata, findings, checks);
        });
    }
}
class ServerIntegratedScanner extends ScannerBase {
    fetchFindingStatus(appIdArg, appMapDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const appId = yield (0, resolveAppId_1.default)(appIdArg, appMapDir);
            return yield new src_1.App(appId).listFindingStatus();
        });
    }
}
class StandaloneScanner extends ScannerBase {
    verifyServerConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    fetchFindingStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
}
