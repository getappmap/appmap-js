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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verbose = exports.toRegExpArray = exports.responseContentType = exports.toRegExp = exports.providesAuthentication = exports.pluralize = exports.dasherize = exports.camelize = exports.parseValue = exports.isRoot = exports.ideLink = exports.isTruthy = exports.isFalsey = exports.fileExists = exports.emptyValue = exports.capitalize = exports.appMapDir = exports.collectAppMapFiles = void 0;
const path_1 = require("path");
const util_1 = require("util");
const glob_1 = require("glob");
const assert_1 = __importDefault(require("assert"));
const promises_1 = require("fs/promises");
function collectAppMapFiles(appmapFile, appmapDir) {
    return __awaiter(this, void 0, void 0, function* () {
        let files = [];
        if (appmapDir) {
            const glob = (0, util_1.promisify)(glob_1.glob);
            files = yield glob(`${appmapDir}/**/*.appmap.json`);
        }
        else {
            (0, assert_1.default)(appmapFile, 'Either appmapDir or appmapFile is required');
            files = typeof appmapFile === 'string' ? [appmapFile] : appmapFile;
        }
        return files;
    });
}
exports.collectAppMapFiles = collectAppMapFiles;
let isVerbose = false;
function verbose(v) {
    if (v !== undefined) {
        isVerbose = v;
    }
    return isVerbose;
}
exports.verbose = verbose;
function capitalize(str) {
    if (!str || str === '') {
        return str;
    }
    return [str.charAt(0).toUpperCase(), str.slice(1)].join('');
}
exports.capitalize = capitalize;
function emptyValue(value) {
    return [null, undefined, ''].includes(value);
}
exports.emptyValue = emptyValue;
function responseContentType(event) {
    var _a, _b;
    if ((_a = event.httpServerResponse) === null || _a === void 0 ? void 0 : _a.headers) {
        return event.httpServerResponse.headers['Content-Type'];
    }
    else if ((_b = event.httpClientResponse) === null || _b === void 0 ? void 0 : _b.headers) {
        return event.httpClientResponse.headers['Content-Type'];
    }
}
exports.responseContentType = responseContentType;
function appMapDir(appMapFileName) {
    return appMapFileName.substring(0, appMapFileName.length - '.appmap.json'.length);
}
exports.appMapDir = appMapDir;
// eslint-disable-next-line
function isFalsey(valueObj) {
    if (!valueObj) {
        return true;
    }
    if (valueObj.class === 'FalseClass') {
        return true;
    }
    if (valueObj.class === 'Array' && valueObj.value === '[]') {
        return true;
    }
    if (valueObj.class === 'Symbol' && valueObj.value === ':failure') {
        return true;
    }
    if (valueObj.value === '') {
        return true;
    }
    return false;
}
exports.isFalsey = isFalsey;
function isArray(valueObj) {
    return valueObj.class === 'Array';
}
function parseValue(valueObj) {
    if (isArray(valueObj) && valueObj.value.length > 2) {
        return valueObj.value
            .slice(1, valueObj.value.length - 1)
            .split(',')
            .map((v) => v.trim());
    }
    return [valueObj.value];
}
exports.parseValue = parseValue;
const isTruthy = (valueObj) => !isFalsey(valueObj);
exports.isTruthy = isTruthy;
function providesAuthentication(event, label) {
    return !!event.returnValue && event.labels.has(label) && isTruthy(event.returnValue);
}
exports.providesAuthentication = providesAuthentication;
function ideLink(filePath, ide, eventId) {
    const OSC = '\u001B]';
    const BEL = '\u0007';
    const SEP = ';';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const supportsHyperlinks = require('supports-hyperlinks');
    if (!supportsHyperlinks.stdout) {
        return filePath;
    }
    let path;
    if (!(0, path_1.isAbsolute)(filePath)) {
        path = `${__dirname}/../../../../../${filePath}`;
    }
    else {
        path = filePath;
    }
    const state = { currentView: 'viewFlow', selectedObject: `event:${eventId}` };
    const encodedState = encodeURIComponent(JSON.stringify(state));
    const link = ide == 'vscode'
        ? `vscode://appland.appmap/open?uri=${path}&state=${encodedState}`
        : `${ide}://open?file=${path}`;
    return [OSC, '8', SEP, SEP, link, BEL, filePath, OSC, '8', SEP, SEP, BEL].join('');
}
exports.ideLink = ideLink;
const toRegExp = (value) => {
    return typeof value === 'string' ? new RegExp(value) : value;
};
exports.toRegExp = toRegExp;
const toRegExpArray = (value) => {
    return value.map(toRegExp);
};
exports.toRegExpArray = toRegExpArray;
const RootLabels = ['command', 'job'];
const isRoot = (event) => {
    if (!event) {
        return true;
    }
    return (!!event.httpServerRequest || RootLabels.some((label) => event.codeObject.labels.has(label)));
};
exports.isRoot = isRoot;
// Attribution: https://github.com/shahata/dasherize
// MIT License
function dasherize(str) {
    return str
        .replace(/[A-Z0-9](?:(?=[^A-Z0-9])|[A-Z0-9]*(?=[A-Z0-9][^A-Z0-9]|$))/g, function (s, i) {
        return (i > 0 ? '-' : '') + s.toLowerCase();
    })
        .replace(/--+/g, '-');
}
exports.dasherize = dasherize;
// Literally StackOverflow
function camelize(text) {
    text = text.replace(/[-_\s.]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
    return text.slice(0, 1).toLowerCase() + text.slice(1);
}
exports.camelize = camelize;
function pluralize(word, count) {
    return count === 1 ? word : [word, 's'].join('');
}
exports.pluralize = pluralize;
function fileExists(file) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, promises_1.stat)(file);
            return true;
        }
        catch (e) {
            return false;
        }
    });
}
exports.fileExists = fileExists;
