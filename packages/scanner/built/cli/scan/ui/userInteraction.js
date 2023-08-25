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
exports.UserInteraction = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const boxen_1 = __importDefault(require("boxen"));
const util_1 = require("../../../rules/lib/util");
// KEG: Sorry, copied from packages/cli/src/cmds/userInteraction.ts
class UserInteraction {
    constructor() {
        this.spinner = (0, ora_1.default)();
    }
    prompt(questions, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const wasSpinning = this.spinner.isSpinning;
            if (wasSpinning) {
                this.spinner.stop();
                this.spinner.clear();
            }
            const result = yield inquirer_1.default.prompt(questions);
            if (wasSpinning && !(opts === null || opts === void 0 ? void 0 : opts.supressSpinner)) {
                this.spinner.start();
            }
            return result;
        });
    }
    continue(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            yield inquirer_1.default.prompt({ type: 'input', name: 'confirm', message: msg });
        });
    }
    confirm(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const { confirm } = yield inquirer_1.default.prompt({
                type: 'confirm',
                name: 'confirm',
                message: msg,
            });
            return confirm;
        });
    }
    progress(msg) {
        console.log(msg);
    }
    success(msg, align = 'center') {
        if (this.spinner.isSpinning) {
            this.spinner.succeed();
        }
        if (msg) {
            console.log((0, boxen_1.default)(msg, {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                textAlignment: align,
            }));
        }
    }
    error(msg) {
        if (this.spinner.isSpinning) {
            this.spinner.fail();
        }
        if (msg) {
            console.error('');
            console.error(msg);
        }
    }
    warn(msg) {
        console.error(msg);
    }
    get status() {
        return this.spinner.text;
    }
    set status(value) {
        if (this.spinner.isSpinning) {
            this.spinner.succeed();
        }
        this.spinner.text = value;
        if (!this.spinner.isSpinning && !(0, util_1.verbose)()) {
            this.spinner.start();
        }
    }
}
exports.UserInteraction = UserInteraction;
const UI = new UserInteraction();
exports.default = UI;
