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
exports.create = void 0;
const url_1 = require("url");
const src_1 = require("@appland/client/dist/src");
const util_1 = require("../../../rules/lib/util");
const retry_1 = __importDefault(require("../retry"));
function create(scanResults, mapsetId, appMapUUIDByFileName, createOptions = {}, retryOptions = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, util_1.verbose)())
            console.warn('Uploading findings');
        let uploadURL;
        let request;
        const retrier = (0, retry_1.default)(`Create scanner job`, retryOptions, makeRequest);
        function makeRequest() {
            return __awaiter(this, void 0, void 0, function* () {
                const payload = JSON.stringify(Object.assign({ scan_results: scanResults, mapset: mapsetId, appmap_uuid_by_file_name: appMapUUIDByFileName }, { merge_key: createOptions.mergeKey }));
                request = yield (0, src_1.buildRequest)('api/scanner_jobs');
                return new Promise((resolve, reject) => {
                    const req = request.requestFunction(request.url, {
                        method: 'POST',
                        headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, request.headers),
                    }, resolve);
                    req.on('error', (0, src_1.retryOnError)(retrier, resolve, reject));
                    req.write(payload);
                    req.end();
                }).then((0, src_1.retryOn503)(retrier));
            });
        }
        return makeRequest()
            .then(src_1.handleError)
            .then((response) => {
            if (response.headers.location) {
                uploadURL = new url_1.URL(response.headers.location, request.url.href);
            }
            return (0, src_1.reportJSON)(response);
        })
            .then((uploadResponse) => {
            uploadResponse.url = uploadURL;
            return uploadResponse;
        });
    });
}
exports.create = create;
