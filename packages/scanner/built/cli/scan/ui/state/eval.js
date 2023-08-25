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
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
const userInteraction_1 = __importDefault(require("../userInteraction"));
const hitBreakpoint_1 = __importDefault(require("./hitBreakpoint"));
const util_1 = require("util");
function initial(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const { expression } = yield userInteraction_1.default.prompt({
            name: 'expression',
            type: 'input',
            message: 'Enter expression:',
        });
        let result;
        try {
            result = ((check, appMap, scope, event) => {
                return eval(expression);
            })(context.progress.check, context.progress.appMap, context.progress.scope, context.progress.event);
        }
        catch (err) {
            console.log(err);
        }
        if (result)
            console.log((0, util_1.inspect)(result));
        return hitBreakpoint_1.default;
    });
}
exports.default = initial;
