"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function rule() {
    return {
        matcher: (e) => e.httpServerResponse.status === 500,
        where: (e) => !!e.httpServerResponse,
    };
}
exports.default = rule;
