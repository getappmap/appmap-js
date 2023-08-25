"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpcWithoutProtection = void 0;
function rpcWithoutProtection(candidateGenerator, options) {
    return {
        matcher: (httpClientRequest) => {
            for (const candidate of candidateGenerator(httpClientRequest)) {
                if (candidate.codeObject.labels.has(options.expectedLabel)) {
                    return false;
                }
            }
            return true;
        },
        where: (e) => !!e.httpClientRequest,
    };
}
exports.rpcWithoutProtection = rpcWithoutProtection;
