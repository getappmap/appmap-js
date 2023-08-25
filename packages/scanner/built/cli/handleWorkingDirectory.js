"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWorkingDirectory = void 0;
function handleWorkingDirectory(directory) {
    if (directory)
        process.chdir(directory);
}
exports.handleWorkingDirectory = handleWorkingDirectory;
