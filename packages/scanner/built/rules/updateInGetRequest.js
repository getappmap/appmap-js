"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./lib/util");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
const assert_1 = __importDefault(require("assert"));
class Options {
    constructor(queryInclude = [/\binsert\b/i, /\bupdate\b/i], queryExclude = []) {
        this._queryInclude = queryInclude;
        this._queryExclude = queryExclude;
    }
    get queryInclude() {
        return this._queryInclude;
    }
    set queryInclude(value) {
        this._queryInclude = (0, util_1.toRegExpArray)(value);
    }
    get queryExclude() {
        return this._queryExclude;
    }
    set queryExclude(value) {
        this._queryExclude = (0, util_1.toRegExpArray)(value);
    }
}
function build(options = new Options()) {
    return {
        matcher: (e) => {
            let httpServerRequest;
            function hasHttpServerRequest() {
                httpServerRequest = e
                    .ancestors()
                    .find((ancestor) => ancestor.httpServerRequest &&
                    ['head', 'get'].includes(ancestor.httpServerRequest.request_method.toLowerCase()));
                return httpServerRequest !== undefined;
            }
            if (options.queryInclude.some((pattern) => e.sqlQuery.match(pattern)) &&
                !options.queryExclude.some((pattern) => e.sqlQuery.match(pattern)) &&
                !e.ancestors().some((ancestor) => ancestor.codeObject.labels.has(Audit)) &&
                hasHttpServerRequest()) {
                (0, assert_1.default)(httpServerRequest, 'HTTP server request is undefined');
                return [
                    {
                        event: e,
                        message: `Data update performed in HTTP request ${httpServerRequest.route}: ${e.sqlQuery}`,
                        participatingEvents: { request: httpServerRequest },
                    },
                ];
            }
        },
        where: (e) => !!e.sqlQuery,
    };
}
const Audit = 'audit';
const RULE = {
    id: 'update-in-get-request',
    title: 'Data update performed in GET or HEAD request',
    scope: 'http_server_request',
    enumerateScope: true,
    labels: [Audit],
    impactDomain: 'Maintainability',
    description: (0, parseRuleDescription_1.default)('updateInGetRequest'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#update-in-get-request',
    Options,
    build,
};
exports.default = RULE;
