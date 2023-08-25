"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const util_1 = require("../rules/lib/util");
function writeln(text = '') {
    process.stdout.write(text);
    process.stdout.write('\n');
}
function default_1(findings, appMapMetadata, ide) {
    if (findings.length === 0) {
        return;
    }
    console.log();
    findings.forEach((finding) => {
        const filePath = ide && finding.appMapFile
            ? (0, util_1.ideLink)(finding.appMapFile, ide, finding.event.id)
            : finding.appMapFile;
        let eventMsg = `\tEvent:\t${finding.event.id} - ${finding.event.toString()}`;
        if (finding.event.elapsedTime !== undefined) {
            eventMsg += ` (${finding.event.elapsedTime}s)`;
        }
        const message = finding.message;
        writeln(chalk_1.default.magenta(message));
        writeln(`\tLink:\t${chalk_1.default.blue(filePath)}`);
        writeln(`\tRule:\t${finding.ruleId}`);
        writeln(`\tAppMap name:\t${appMapMetadata[finding.appMapFile].name}`);
        writeln(eventMsg);
        writeln(`\tScope:\t${finding.scope.id} - ${finding.scope.toString()}`);
        if (finding.stack.length > 0) {
            writeln(`\tStack trace:`);
            finding.stack.forEach((frame) => console.log(`\t\t${frame}`));
        }
        writeln();
    });
}
exports.default = default_1;
