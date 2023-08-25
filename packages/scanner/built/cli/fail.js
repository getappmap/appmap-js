"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
function fail(numFindings) {
    if (numFindings > 0) {
        yargs_1.default.exit(1, new Error(`${numFindings} findings`));
    }
}
exports.default = fail;
