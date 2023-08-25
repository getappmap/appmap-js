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
exports.merge = void 0;
const src_1 = require("@appland/client/dist/src");
const url_1 = require("url");
function merge(appId, mergeKey) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Merging scan results in app ${appId} with merge key ${mergeKey}`);
        const payload = JSON.stringify({
            app: appId,
            merge_key: mergeKey,
        });
        const request = yield (0, src_1.buildRequest)('api/scanner_jobs/merge');
        let uploadURL;
        return new Promise((resolve, reject) => {
            const req = request.requestFunction(request.url, {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, request.headers),
            }, resolve);
            req.on('error', reject);
            req.write(payload);
            req.end();
        })
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
exports.merge = merge;
