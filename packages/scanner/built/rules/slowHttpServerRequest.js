"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
class Options {
    constructor() {
        this.timeAllowed = 1;
    }
}
function build(options) {
    return {
        matcher: (e) => e.elapsedTime > options.timeAllowed,
        message: () => `Slow HTTP server request (> ${options.timeAllowed * 1000}ms)`,
        where: (e) => !!e.httpServerRequest && e.elapsedTime !== undefined,
    };
}
const RULE = {
    id: 'slow-http-server-request',
    title: 'Slow HTTP server request',
    scope: 'http_server_request',
    enumerateScope: false,
    impactDomain: 'Performance',
    description: (0, parseRuleDescription_1.default)('slowHttpServerRequest'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#slow-http-server-request',
    Options,
    build,
};
exports.default = RULE;
