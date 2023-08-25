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
const commitStatus_1 = __importDefault(require("../integration/github/commitStatus"));
function updateCommitStatus(numFindings, numChecks) {
    return __awaiter(this, void 0, void 0, function* () {
        if (numFindings > 0) {
            yield (0, commitStatus_1.default)('failure', `${numChecks} checks, ${numFindings} findings. See CI job log for details.`);
            console.log(`Commit status updated to: failure (${numFindings} findings)`);
        }
        else {
            yield (0, commitStatus_1.default)('success', `${numChecks} checks passed`);
            console.log(`Commit status updated to: success.`);
        }
    });
}
exports.default = updateCommitStatus;
