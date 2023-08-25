"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../rules/lib/util");
const RetryDelay = 500;
const MaxRetries = 3;
function retry(description, retryOptions, retryFn) {
    var _a, _b;
    const maxRetries = (_a = retryOptions.maxRetries) !== null && _a !== void 0 ? _a : MaxRetries;
    const retryDelay = (_b = retryOptions.retryDelay) !== null && _b !== void 0 ? _b : RetryDelay;
    let retryCount = 0;
    function computeDelay() {
        return retryDelay * Math.pow(2, retryCount - 1);
    }
    return (resolve, reject) => {
        retryCount += 1;
        if (retryCount > maxRetries) {
            reject(new Error(`${description} failed: Max retries exceeded.`));
        }
        if ((0, util_1.verbose)()) {
            console.log(`Retrying ${description} in ${computeDelay()}ms`);
        }
        setTimeout(() => retryFn().then(resolve).catch(reject), computeDelay());
    };
}
exports.default = retry;
