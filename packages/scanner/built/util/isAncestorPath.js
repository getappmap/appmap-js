"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
function isAncestorPath(ancestor, descendant) {
    const relative = path_1.default.relative(ancestor, descendant);
    return !relative.startsWith('..') && !path_1.default.isAbsolute(relative);
}
exports.default = isAncestorPath;
