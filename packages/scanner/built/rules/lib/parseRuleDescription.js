"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const util_1 = require("./util");
function parseRuleDescription(id) {
    const docPath = (0, path_1.join)(__dirname, `../../../doc/rules/${(0, util_1.dasherize)(id)}.md`);
    if (!fs_1.default.existsSync(docPath))
        return `No doc exists for rule ${id}`;
    // replace any carriage return with a newline
    const content = fs_1.default.readFileSync(docPath, 'utf-8').replace(/\r\n/g, '\n');
    const propertiesContent = content.match(/---\n((?:.*\n)+)---\n((?:.*\n)+?)##?#?/);
    if (!propertiesContent) {
        // This is probably a new doc that doesn't have front matter yet.
        // It's all description.
        return content;
    }
    return propertiesContent[2].replace(/\n/g, ' ').trim();
}
exports.default = parseRuleDescription;
