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
const src_1 = require("@appland/client/dist/src");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const errors_1 = require("../errors");
function resolveAppId(appIdArg, appMapDir) {
    return __awaiter(this, void 0, void 0, function* () {
        if (appIdArg) {
            return appIdArg;
        }
        if (appMapDir) {
            let searchPath = (0, path_1.resolve)(appMapDir);
            while (searchPath !== '/' && searchPath !== '.') {
                const configPath = (0, path_1.join)(searchPath, 'appmap.yml');
                try {
                    yield (0, promises_1.access)(configPath, fs_1.constants.R_OK);
                }
                catch (_a) {
                    searchPath = (0, path_1.dirname)(searchPath);
                    continue;
                }
                const configContent = yield (0, promises_1.readFile)(configPath, 'utf-8');
                const config = (0, js_yaml_1.load)(configContent);
                if (config.name)
                    return config.name;
            }
        }
    });
}
function default_1(appIdArg, appMapDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const appId = yield resolveAppId(appIdArg, appMapDir);
        if (!appId)
            throw new errors_1.ValidationError('App was not provided and could not be resolved');
        const appExists = yield new src_1.App(appId).exists();
        if (!appExists) {
            throw new errors_1.ValidationError(`App "${appId}" is not valid or does not exist.\nPlease fix the app name in the appmap.yml file, or override it with the --app option.`);
        }
        return appId;
    });
}
exports.default = default_1;
