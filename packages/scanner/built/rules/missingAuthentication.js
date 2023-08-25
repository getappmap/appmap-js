"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const openapi_1 = require("@appland/openapi");
const util_1 = require("./lib/util");
const matchPattern_1 = require("./lib/matchPattern");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
function isPublic(event) {
    return event.labels.has(AccessPublic);
}
const authenticatedBy = (iterator) => {
    let i = iterator.next();
    while (!i.done) {
        if (isPublic(i.value.event) || (0, util_1.providesAuthentication)(i.value.event, SecurityAuthentication)) {
            return true;
        }
        i = iterator.next();
    }
    return false;
};
class Options {
    constructor() {
        this.includeContentTypes = [];
        this.excludeContentTypes = [];
    }
}
function build(options = new Options()) {
    const includeContentTypes = (0, matchPattern_1.buildFilters)(options.includeContentTypes);
    const excludeContentTypes = (0, matchPattern_1.buildFilters)(options.excludeContentTypes);
    function testContentType(contentType) {
        if (!contentType)
            return false;
        const content = contentType;
        function test(filter) {
            return filter(content);
        }
        return ((includeContentTypes.length === 0 || includeContentTypes.some(test)) &&
            !excludeContentTypes.some(test));
    }
    function matcher(event) {
        if (!authenticatedBy(new models_1.EventNavigator(event).descendants())) {
            return [
                {
                    event: event,
                    message: `Unauthenticated HTTP server request: ${event.route}`,
                },
            ];
        }
    }
    function where(e) {
        return (e.route !== undefined &&
            e.httpServerResponse !== undefined &&
            e.httpServerResponse.status < 300 &&
            !!(0, openapi_1.rpcRequestForEvent)(e) &&
            !!(0, openapi_1.rpcRequestForEvent)(e).responseContentType &&
            testContentType((0, openapi_1.rpcRequestForEvent)(e).responseContentType));
    }
    return {
        where,
        matcher,
    };
}
const AccessPublic = 'access.public';
const SecurityAuthentication = 'security.authentication';
const RULE = {
    id: 'missing-authentication',
    title: 'Unauthenticated HTTP server request',
    scope: 'http_server_request',
    labels: [AccessPublic, SecurityAuthentication],
    impactDomain: 'Security',
    enumerateScope: false,
    references: {
        'CWE-306': new url_1.URL('https://cwe.mitre.org/data/definitions/306.html'),
    },
    description: (0, parseRuleDescription_1.default)('missingAuthentication'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#missing-authentication',
    Options,
    build,
};
exports.default = RULE;
