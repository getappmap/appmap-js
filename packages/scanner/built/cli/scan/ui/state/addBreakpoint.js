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
const readline_1 = require("readline");
const breakpoint_1 = require("../../breakpoint");
const userInteraction_1 = __importDefault(require("../userInteraction"));
const scan_1 = __importDefault(require("./scan"));
const history = [];
function addBreakpoint(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const onCounter = () => __awaiter(this, void 0, void 0, function* () {
            const { sequenceNumber } = yield userInteraction_1.default.prompt({
                name: 'sequenceNumber',
                type: 'number',
                message: 'Sequence number:',
            });
            return new breakpoint_1.BreakOnCounter(Number(sequenceNumber));
        });
        const onEventName = () => __awaiter(this, void 0, void 0, function* () {
            const { eventName } = yield userInteraction_1.default.prompt({
                name: 'eventName',
                type: 'input',
                message: 'Event name:',
            });
            return new breakpoint_1.BreakOnEvent(eventName);
        });
        const onLabel = () => __awaiter(this, void 0, void 0, function* () {
            const { labelName } = yield userInteraction_1.default.prompt({
                name: 'labelName',
                type: 'input',
                message: 'Event label:',
            });
            return new breakpoint_1.BreakOnLabel(labelName);
        });
        const onCodeObject = () => __awaiter(this, void 0, void 0, function* () {
            let codeObjectName;
            if (!context.progress.appMap) {
                codeObjectName = (yield userInteraction_1.default.prompt({
                    name: 'codeObjectName',
                    type: 'input',
                    message: 'Code object:',
                }))['codeObjectName'];
            }
            else {
                let codeObjectIds = [];
                const collectCodeObjectNames = (codeObject) => {
                    codeObjectIds.push(codeObject.fqid);
                };
                context.progress.appMap.classMap.visit(collectCodeObjectNames);
                codeObjectIds = codeObjectIds.sort();
                const codeObjectCompleter = (line) => {
                    let options = codeObjectIds.filter((id) => id.startsWith(line));
                    if (options.length === 0)
                        options = codeObjectIds
                            .filter((id) => id.includes(line))
                            .map((id) => id.slice(id.indexOf(line)));
                    return [options, line];
                };
                codeObjectName = yield new Promise((resolve, _reject) => {
                    const rl = (0, readline_1.createInterface)({
                        input: process.stdin,
                        output: process.stdout,
                        completer: codeObjectCompleter,
                        history,
                        historySize: 1000,
                        removeHistoryDuplicates: true,
                        prompt: 'Code object: ',
                        tabSize: 4,
                    });
                    let response = '';
                    rl.on('line', (data) => {
                        response = data;
                        rl.close();
                    });
                    rl.on('close', () => {
                        resolve(response);
                    });
                    rl.prompt();
                });
            }
            if (codeObjectName && codeObjectName !== '')
                return new breakpoint_1.BreakOnCodeObject(codeObjectName);
        });
        const choices = {
            'break at sequence number': onCounter,
            'break on label': onLabel,
            'break on code object': onCodeObject,
            'break on event name': onEventName,
            quit: null,
        };
        userInteraction_1.default.progress(`Choose a breakpoint type, and enter the criteria.`);
        userInteraction_1.default.progress(`NOTE: label, code object, and event name breakpoints can be regular expressions.`);
        userInteraction_1.default.progress(`      To enter a regular expression, use the syntax: /expr/`);
        const { action: actionName } = yield userInteraction_1.default.prompt({
            name: 'action',
            type: 'list',
            message: 'How would you like to proceed?:',
            choices: Object.keys(choices),
        });
        const action = choices[actionName];
        if (!action)
            return scan_1.default;
        const breakpoint = yield action();
        if (breakpoint)
            context.progress.addBreakpoint(breakpoint);
        return scan_1.default;
    });
}
exports.default = addBreakpoint;
