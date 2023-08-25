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
const hitBreakpoint_1 = __importDefault(require("./hitBreakpoint"));
const initial_1 = __importDefault(require("./initial"));
function scan(context) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            context.on('breakpoint', (breakpoint) => {
                context.removeAllListeners();
                context.breakpoint = breakpoint;
                resolve(hitBreakpoint_1.default);
            });
            context.on('complete', () => {
                context.removeAllListeners();
                resolve(initial_1.default);
            });
            context.scan();
        });
    });
}
exports.default = scan;
