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
const console_1 = require("console");
const events_1 = __importDefault(require("events"));
const promises_1 = require("fs/promises");
const appMapIndex_1 = __importDefault(require("../../../appMapIndex"));
const ruleChecker_1 = __importDefault(require("../../../ruleChecker"));
const interactiveProgess_1 = __importDefault(require("./interactiveProgess"));
class ScanContext extends events_1.default {
    constructor(checks, files) {
        super();
        this.checks = checks;
        this.files = files;
        this.isScanning = false;
        this.progress = new interactiveProgess_1.default();
        this.checker = new ruleChecker_1.default(this.progress);
        this.progress.on('breakpoint', (breakpoint) => {
            this.emit('breakpoint', breakpoint);
        });
    }
    scan() {
        if (this.isScanning) {
            this.progress.resume();
        }
        else {
            this.progress.initialize();
            this.doScan();
        }
    }
    doScan() {
        return __awaiter(this, void 0, void 0, function* () {
            (0, console_1.assert)(!this.isScanning, 'Scanning already in progress');
            this.isScanning = true;
            const findings = [];
            for (let fileIndex = 0; fileIndex < this.files.length; fileIndex++) {
                const fileName = this.files[fileIndex];
                const appMapData = yield (0, promises_1.readFile)(fileName, 'utf8');
                const appMap = (0, models_1.buildAppMap)(appMapData).normalize().build();
                const appMapIndex = new appMapIndex_1.default(appMap);
                yield this.progress.beginAppMap(fileName, appMap);
                for (let checkIndex = 0; checkIndex < this.checks.length; checkIndex++) {
                    const check = this.checks[checkIndex];
                    yield this.progress.beginCheck(check);
                    yield this.checker.check(fileName, appMapIndex, check, findings);
                    yield this.progress.endCheck();
                }
                yield this.progress.endAppMap();
            }
            this.isScanning = false;
            this.emit('complete', findings);
        });
    }
}
exports.default = ScanContext;
