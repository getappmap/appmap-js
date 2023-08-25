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
const js_yaml_1 = require("js-yaml");
const url_1 = require("url");
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const promises_1 = require("fs/promises");
const URLLoader = (protocol) => {
    return (url) => {
        return new Promise((resolve, reject) => {
            protocol
                .get(url)
                .on('response', (response) => {
                if (response.statusCode !== 200) {
                    return reject(`${response.statusCode || ''} ${response.statusMessage || ''}`);
                }
                const data = [];
                response
                    .on('data', (chunk) => {
                    data.push(Buffer.from(chunk));
                })
                    .on('end', () => {
                    resolve(Buffer.concat(data));
                });
            })
                .on('error', reject);
        });
    };
};
const FileLoader = (url) => {
    return (0, promises_1.readFile)((0, url_1.fileURLToPath)(url));
};
const ProtocolLoader = {
    'http:': URLLoader(http_1.default),
    'https:': URLLoader(https_1.default),
    'file:': FileLoader,
};
const fetch = (urlStr) => {
    const url = new url_1.URL(urlStr);
    const loader = ProtocolLoader[url.protocol];
    if (!loader) {
        throw new Error(`No schema loader for protocol ${url.protocol}`);
    }
    return loader(url);
};
const SchemaCache = {};
const schemaCache = (key, fn) => __awaiter(void 0, void 0, void 0, function* () {
    const cachedResult = SchemaCache[key];
    if (cachedResult) {
        return cachedResult;
    }
    const result = yield fn(key);
    SchemaCache[key] = result;
    return result;
});
const fetchSchema = (sourceURL) => __awaiter(void 0, void 0, void 0, function* () {
    return schemaCache(sourceURL, (sourceURL) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield fetch(sourceURL);
        return (0, js_yaml_1.load)(data.toString());
    }));
});
const lookup = (host, openapiSchemata) => __awaiter(void 0, void 0, void 0, function* () {
    const sourceURL = openapiSchemata[host];
    if (!sourceURL) {
        throw new Error(`No OpenAPI schema URL configured for host ${host}. Available hosts are: ${Object.keys(openapiSchemata).join(', ')}`);
    }
    return yield fetchSchema(sourceURL);
});
exports.default = lookup;
