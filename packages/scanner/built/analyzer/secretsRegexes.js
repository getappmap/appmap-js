"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.looksSecret = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const regexData = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, 'secretsRegexesData.json')).toString());
const REGEXES = Object.keys(regexData).reduce((memo, key) => {
    const value = regexData[key];
    const regexes = Array.isArray(value) ? value : [value];
    memo[key] = regexes.map((regex) => new RegExp(regex));
    return memo;
}, {});
const AnySecretRE = new RegExp('(?:' + Object.values(regexData).flat().join(')|(?:') + ')');
// Check if a string contains any defined secret regex
exports.looksSecret = AnySecretRE.test.bind(AnySecretRE);
exports.default = REGEXES;
