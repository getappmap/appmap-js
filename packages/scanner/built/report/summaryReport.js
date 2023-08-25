"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const util_1 = require("../rules/lib/util");
function summarizeFindings(findings) {
    const result = findings.reduce((memo, finding) => {
        let findingSummary = memo[finding.ruleId];
        if (findingSummary) {
            findingSummary.findingTotal += 1;
            if (!findingSummary.findingHashes.has(finding.hash_v2)) {
                findingSummary.findingHashes.add(finding.hash_v2);
                findingSummary.messages.push(finding.message);
            }
        }
        else {
            findingSummary = {
                ruleId: finding.ruleId,
                ruleTitle: finding.ruleTitle,
                findingTotal: 1,
                findingHashes: new Set([finding.hash_v2]),
                messages: [finding.message],
            };
            memo[finding.ruleId] = findingSummary;
        }
        return memo;
    }, {});
    Object.values(result).forEach((findingSummary) => (findingSummary.messages = findingSummary.messages.sort()));
    return Object.values(result);
}
function default_1(summary, colorize) {
    const matchedStr = `${summary.summary.numFindings} ${(0, util_1.pluralize)('finding', summary.summary.numFindings)} (${new Set(summary.findings.map((finding) => finding.hash_v2)).size} unique)`;
    const colouredMatchedStr = colorize ? chalk_1.default.stderr.magenta(matchedStr) : matchedStr;
    console.log();
    console.log(colouredMatchedStr);
    summarizeFindings(summary.findings)
        .sort((a, b) => a.ruleTitle.localeCompare(b.ruleTitle))
        .forEach((finding) => {
        const casesStr = `\t- ${finding.ruleTitle} (${finding.ruleId}) : ${finding.findingTotal} ${(0, util_1.pluralize)('case', finding.findingTotal)} (${finding.findingHashes.size} unique)`;
        console.log(colorize ? chalk_1.default.stderr.magenta(casesStr) : casesStr);
        finding.messages.forEach((message) => {
            const messageStr = `\t\t${message}`;
            console.log(colorize ? chalk_1.default.stderr.magenta(messageStr) : messageStr);
        });
    });
}
exports.default = default_1;
