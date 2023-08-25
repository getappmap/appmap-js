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
const events_1 = __importDefault(require("events"));
class InteractiveProgress extends events_1.default {
    constructor() {
        super();
        this.breakpoints = [];
        this.depth = 0;
        this.counter = 0;
        this.initialize();
    }
    initialize() {
        this.depth = 0;
        this.counter = 0;
    }
    addBreakpoint(breakpoint) {
        this.breakpoints.push(breakpoint);
    }
    removeBreakpoint(breakpoint) {
        this.breakpoints = this.breakpoints.filter((b) => b !== breakpoint);
    }
    get prefix() {
        const counterStr = `(${this.counter}) `;
        return (counterStr + '  '.repeat(this.depth).padStart(10 + this.depth * 2 - counterStr.length, ' '));
    }
    resume() {
        if (!this.breakpointResolver)
            return;
        this.breakpointResolver();
        this.breakpointResolver = undefined;
    }
    breakOn(eventName, variables) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = Object.assign({ eventName, appMap: this.appMap, appMapFileName: this.appMapFileName, check: this.check, scope: this.scope, counter: this.counter, depth: this.depth }, variables);
            const hitBreakpoint = this.breakpoints.find((b) => b.condition(context));
            if (!hitBreakpoint)
                return;
            this.emit('breakpoint', hitBreakpoint, context);
            return new Promise((resolve) => {
                this.breakpointResolver = resolve;
            });
        });
    }
    beginAppMap(appMapFileName, appMap) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`${this.prefix}beginAppMap: ${appMapFileName}`);
            this.depth += 1;
            this.appMapFileName = appMapFileName;
            this.appMap = appMap;
            yield this.breakOn('beginAppMap', {});
            this.counter += 1;
        });
    }
    beginCheck(check) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`${this.prefix}beginCheck: ${check}`);
            this.depth += 1;
            this.check = check;
            yield this.breakOn('beginCheck', {});
            this.counter += 1;
        });
    }
    filterScope(scopeName, scope) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`${this.prefix}filterScope: ${scopeName} ${scope}`);
            yield this.breakOn('filterScope', {});
            this.counter += 1;
        });
    }
    enterScope(scope) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`${this.prefix}enterScope: ${scope}`);
            this.depth += 1;
            this.scope = scope;
            yield this.breakOn('enterScope', {});
            this.counter += 1;
        });
    }
    filterEvent(event) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`${this.prefix}filterEvent: ${event}`);
            this.event = event;
            yield this.breakOn('filterEvent', { event });
            this.event = undefined;
            this.counter += 1;
        });
    }
    matchResult(event, matchResult) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`${this.prefix}matchResult: ${matchResult}`);
            this.event = event;
            yield this.breakOn('matchResult', { matchResult });
            this.event = undefined;
            this.counter += 1;
        });
    }
    matchEvent(event, _appMapIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`${this.prefix}matchEvent: ${event}`);
            this.event = event;
            yield this.breakOn('matchEvent', {});
            this.event = undefined;
            this.counter += 1;
        });
    }
    leaveScope() {
        return __awaiter(this, void 0, void 0, function* () {
            this.depth -= 1;
            console.log(`${this.prefix}leaveScope`);
            yield this.breakOn('leaveScope', {});
            this.scope = undefined;
            this.counter += 1;
        });
    }
    endCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            this.depth -= 1;
            console.log(`${this.prefix}endCheck`);
            yield this.breakOn('endCheck', {});
            this.check = undefined;
            this.counter += 1;
        });
    }
    endAppMap() {
        return __awaiter(this, void 0, void 0, function* () {
            this.depth -= 1;
            console.log(`${this.prefix}endAppMap`);
            yield this.breakOn('endAppMap', {});
            this.appMap = undefined;
            this.appMapFileName = undefined;
            this.counter += 1;
        });
    }
}
exports.default = InteractiveProgress;
