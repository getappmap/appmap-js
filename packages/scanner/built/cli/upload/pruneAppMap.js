"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAppMap = exports.pruneAppMap = exports.maxAppMapSize = void 0;
const models_1 = require("@appland/models");
const APPMAP_UPLOAD_MAX_SIZE = parseInt(process.env.APPMAP_UPLOAD_MAX_SIZE || '40960') * 1024;
if (!APPMAP_UPLOAD_MAX_SIZE) {
    throw Error(`Failed parsing APPMAP_UPLOAD_MAX_SIZE: "${process.env.APPMAP_UPLOAD_MAX_SIZE}"`);
}
function maxAppMapSize() {
    return APPMAP_UPLOAD_MAX_SIZE;
}
exports.maxAppMapSize = maxAppMapSize;
function pruneAppMap(builder, maxSize) {
    return builder.prune(maxSize);
}
exports.pruneAppMap = pruneAppMap;
function buildAppMap(appMapJson) {
    return (0, models_1.buildAppMap)().source(appMapJson);
}
exports.buildAppMap = buildAppMap;
