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
const async_1 = require("async");
const promises_1 = require("fs/promises");
const src_1 = require("@appland/client/dist/src");
const util_1 = require("../rules/lib/util");
const create_1 = require("../integration/appland/scannerJob/create");
const vars_1 = require("../integration/vars");
const path_1 = require("path");
const pruneAppMap_1 = require("./upload/pruneAppMap");
function create(scanResults, appId, appMapDir, mergeKey, mapsetOptions = {}, retryOptions = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, util_1.verbose)())
            console.log(`Uploading AppMaps and findings to application '${appId}'`);
        const { findings } = scanResults;
        const relevantFilePaths = [
            ...new Set(findings.filter((f) => f.appMapFile).map((f) => f.appMapFile)),
        ];
        const appMapUUIDByFileName = {};
        const branchCount = {};
        const commitCount = {};
        const createAppMapOptions = {
            app: appId,
        };
        const q = (0, async_1.queue)((filePath, callback) => __awaiter(this, void 0, void 0, function* () {
            if ((0, util_1.verbose)())
                console.log(`Uploading AppMap ${filePath}`);
            const filePaths = [filePath, (0, path_1.join)(appMapDir, filePath)];
            const filePathsExist = yield Promise.all(filePaths.map(util_1.fileExists));
            const fullPath = filePaths.find((_, fileIndex) => filePathsExist[fileIndex]);
            if (!fullPath)
                throw new Error(`File ${filePath} not found`);
            (0, promises_1.readFile)(fullPath)
                .then((buffer) => {
                const maxSize = (0, pruneAppMap_1.maxAppMapSize)();
                const appMapJson = JSON.parse(buffer.toString());
                const builder = (0, pruneAppMap_1.buildAppMap)(appMapJson);
                let metadata = appMapJson.metadata;
                if (buffer.byteLength > maxSize) {
                    console.warn(`${fullPath} is larger than ${maxSize / 1024}K, pruning it`);
                    (0, pruneAppMap_1.pruneAppMap)(builder, maxSize);
                }
                const prunedAppMap = builder.normalize().build();
                metadata = prunedAppMap.metadata;
                buffer = Buffer.from(JSON.stringify(prunedAppMap));
                return { metadata, buffer };
            })
                .then(({ metadata, buffer }) => {
                var _a, _b;
                const branch = (_a = metadata.git) === null || _a === void 0 ? void 0 : _a.branch;
                const commit = (_b = metadata.git) === null || _b === void 0 ? void 0 : _b.commit;
                if (branch) {
                    branchCount[branch] || (branchCount[branch] = 1);
                    branchCount[branch] += 1;
                }
                if (commit) {
                    commitCount[commit] || (commitCount[commit] = 1);
                    commitCount[commit] += 1;
                }
                return src_1.AppMap.create(buffer, Object.assign(retryOptions, Object.assign(Object.assign({}, createAppMapOptions), { metadata })));
            })
                .then((appMap) => {
                if (appMap) {
                    appMapUUIDByFileName[filePath] = appMap.uuid;
                }
            })
                .then(() => callback(null))
                .catch(callback);
        }), 3);
        q.error((err, filePath) => {
            console.error(`An error occurred uploading ${filePath}: ${err}`);
        });
        if ((0, util_1.verbose)())
            console.log(`Uploading ${relevantFilePaths.length} AppMaps`);
        q.push(relevantFilePaths);
        if (!q.idle())
            yield q.drain();
        const mostFrequent = (counts) => {
            if (Object.keys(counts).length === 0)
                return;
            const maxCount = Object.values(counts).reduce((max, count) => Math.max(max, count), 0);
            return Object.entries(counts).find((e) => e[1] === maxCount)[0];
        };
        mapsetOptions.branch || (mapsetOptions.branch = (0, vars_1.branch)() || mostFrequent(branchCount));
        mapsetOptions.commit || (mapsetOptions.commit = (0, vars_1.sha)() || mostFrequent(commitCount));
        const mapset = yield src_1.Mapset.create(appId, Object.values(appMapUUIDByFileName), mapsetOptions, retryOptions);
        console.warn('Uploading findings');
        return (0, create_1.create)(scanResults, mapset.id, appMapUUIDByFileName, { mergeKey }, retryOptions);
    });
}
exports.default = create;
