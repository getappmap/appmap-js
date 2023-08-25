"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openapi_1 = require("@appland/openapi");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
const isRedirect = (status) => [301, 302, 303, 307, 308].includes(status);
const hasContent = (status) => status !== 204;
function build() {
    function matcher(event) {
        if ((0, openapi_1.rpcRequestForEvent)(event).responseContentType === undefined) {
            return `Missing HTTP content type in response to request: ${event.route}`;
        }
    }
    function where(e) {
        return (!!e.httpServerResponse &&
            !isRedirect(e.httpServerResponse.status) &&
            hasContent(e.httpServerResponse.status));
    }
    return {
        matcher,
        where,
    };
}
const RULE = {
    id: 'missing-content-type',
    title: 'HTTP server request without a Content-Type header',
    scope: 'http_server_request',
    impactDomain: 'Stability',
    enumerateScope: false,
    description: (0, parseRuleDescription_1.default)('missingContentType'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#missing-content-type',
    build,
};
exports.default = RULE;
