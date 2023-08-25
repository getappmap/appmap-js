"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitCode = void 0;
var ExitCode;
(function (ExitCode) {
    ExitCode[ExitCode["ValidationError"] = 1] = "ValidationError";
    ExitCode[ExitCode["AbortError"] = 2] = "AbortError";
    ExitCode[ExitCode["RuntimeError"] = 3] = "RuntimeError";
    ExitCode[ExitCode["Finding"] = 10] = "Finding";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
