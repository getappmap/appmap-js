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
const userInteraction_1 = __importDefault(require("../userInteraction"));
const initial_1 = __importDefault(require("./initial"));
function hitBreakpoint(context) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const choices = {
            'show hints': 'hint',
            'evaluate expression': 'eval',
            'add breakpoint': 'addBreakpoint',
            continue: 'scan',
            quit: null,
        };
        userInteraction_1.default.progress(`In breakpoint: ${context.breakpoint}`);
        if (context.progress.appMapFileName) {
            const line = context.progress.appMapFileName;
            const eventId = ((_a = context.progress.event) === null || _a === void 0 ? void 0 : _a.id) || ((_b = context.progress.scope) === null || _b === void 0 ? void 0 : _b.id);
            userInteraction_1.default.progress([line, eventId].filter(Boolean).join(':'));
        }
        const { action: actionName } = yield userInteraction_1.default.prompt({
            name: 'action',
            type: 'list',
            message: 'Choose action:',
            choices: Object.keys(choices),
        });
        const action = choices[actionName];
        if (!action)
            return initial_1.default;
        return (yield Promise.resolve().then(() => __importStar(require(`./${action}`)))).default;
    });
}
exports.default = hitBreakpoint;
