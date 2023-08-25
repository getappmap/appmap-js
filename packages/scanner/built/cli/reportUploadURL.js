"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function reportUploadURL(numFindings, url) {
    let message = `Uploaded ${numFindings} findings`;
    if (url) {
        message += ` to ${url}`;
    }
    console.log(message);
}
exports.default = reportUploadURL;
