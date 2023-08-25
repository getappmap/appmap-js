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
exports.appmapDirFromConfig = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const js_yaml_1 = require("js-yaml");
const util_1 = require("util");
function appmapDirFromConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const appMapConfigExists = yield (0, util_1.promisify)(fs_1.exists)('appmap.yml');
        if (appMapConfigExists) {
            const appMapConfigData = (0, js_yaml_1.load)((yield (0, promises_1.readFile)('appmap.yml')).toString());
            if (appMapConfigData && typeof appMapConfigData === 'object') {
                const configData = appMapConfigData;
                return configData['appmap_dir'];
            }
        }
    });
}
exports.appmapDirFromConfig = appmapDirFromConfig;
