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
exports.fileModifiedDate = exports.gitModifiedDate = exports.gitExists = exports.isCached = exports.resetCache = void 0;
const console_1 = require("console");
const util_1 = require("./rules/lib/util");
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const FileModifiedDate = new Map();
let GitExists;
function resetCache() {
    FileModifiedDate.clear();
}
exports.resetCache = resetCache;
function isCached(file) {
    return FileModifiedDate.has(file);
}
exports.isCached = isCached;
function detectGitExists() {
    return new Promise((resolve) => {
        (0, child_process_1.exec)('git --version', (err) => {
            if (err && err.code && err.code > 0)
                resolve(false);
            resolve(true);
        });
    });
}
function gitExists() {
    return __awaiter(this, void 0, void 0, function* () {
        if (GitExists === undefined) {
            GitExists = yield detectGitExists();
        }
        return GitExists;
    });
}
exports.gitExists = gitExists;
function gitModifiedDate(file) {
    return new Promise((resolve) => {
        (0, child_process_1.exec)(`git log -n 1 --pretty=format:%cI ${file}`, (err, stdout) => {
            if (err && err.code && err.code > 0)
                resolve(undefined);
            if (stdout.trim() === '')
                resolve(undefined);
            resolve(new Date(stdout));
        });
    });
}
exports.gitModifiedDate = gitModifiedDate;
function fileModifiedDate(file) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield (0, promises_1.stat)(file);
            return stats.mtime;
        }
        catch (e) {
            (0, console_1.warn)(e);
        }
    });
}
exports.fileModifiedDate = fileModifiedDate;
function lastGitOrFSModifiedDate(file) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = FileModifiedDate.get(file);
        if (result) {
            if ((0, util_1.verbose)())
                (0, console_1.debug)(`Using cached modified date for ${file}`);
            return result.getTime() === 0 ? undefined : result;
        }
        if ((0, util_1.verbose)())
            (0, console_1.debug)(`Computing modified date for ${file}`);
        if (yield gitExists())
            result = yield gitModifiedDate(file);
        if (!result)
            result = yield fileModifiedDate(file);
        FileModifiedDate.set(file, result || new Date(0));
        return result;
    });
}
exports.default = lastGitOrFSModifiedDate;
