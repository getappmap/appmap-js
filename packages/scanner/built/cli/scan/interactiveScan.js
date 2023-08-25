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
const configurationProvider_1 = require("../../configuration/configurationProvider");
const util_1 = require("../../rules/lib/util");
const validateFile_1 = __importDefault(require("../validateFile"));
const scanContext_1 = __importDefault(require("./ui/scanContext"));
const initial_1 = __importDefault(require("./ui/state/initial"));
function interactiveScan(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { appmapFile, appmapDir, configuration } = options;
        const checks = yield (0, configurationProvider_1.loadConfig)(configuration);
        const files = yield (0, util_1.collectAppMapFiles)(appmapFile, appmapDir);
        yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () { return (0, validateFile_1.default)('file', file); })));
        const context = new scanContext_1.default(checks, files);
        let state = initial_1.default;
        while (state) {
            const newState = yield state(context);
            state = newState;
        }
    });
}
exports.default = interactiveScan;
