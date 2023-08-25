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
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const SqlErrors = new Set();
const SqlParseErrorFileName = 'sql_warning.txt';
let SqlParseErrorFileOpened = false;
function writeErrorToFile(error) {
    return __awaiter(this, void 0, void 0, function* () {
        const flags = SqlParseErrorFileOpened ? 'a' : 'w';
        SqlParseErrorFileOpened = true;
        (0, promises_1.open)(SqlParseErrorFileName, flags).then((handle) => {
            handle.write([error.toString(), ''].join('\n')).finally(handle.close.bind(handle));
        });
    });
}
function sqlWarning(parseError) {
    if (!SqlErrors.has(parseError.sql)) {
        writeErrorToFile(parseError);
        SqlErrors.add(parseError.sql);
    }
}
exports.default = sqlWarning;
