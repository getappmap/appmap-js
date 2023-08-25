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
const openapi_1 = require("../openapi");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
const openapiProvider_1 = __importDefault(require("./lib/openapiProvider"));
const assert_1 = __importDefault(require("assert"));
class Options {
    constructor() {
        this.schemata = {};
    }
}
const changeMessage = (change) => {
    return `HTTP client request is incompatible with OpenAPI schema. Change details: ${change.action} ${change.sourceSpecEntityDetails
        .concat(change.destinationSpecEntityDetails)
        .map((detail) => detail.location)
        .join(', ')}`;
};
function build(options) {
    function matcher(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const clientFragment = (0, openapi_1.forClientRequest)(event);
            (0, assert_1.default)(event.httpClientRequest);
            if (!event.httpClientRequest.url)
                return [];
            const host = new URL(event.httpClientRequest.url).host;
            const serverSchema = yield (0, openapiProvider_1.default)(host, options.schemata);
            const clientSchema = {
                openapi: '3.0.0',
                info: {
                    title: 'Schema derived from client request',
                    version: serverSchema.info.version, // Indicate that it *should* be compatible.
                },
                paths: clientFragment.paths,
                components: { securitySchemes: clientFragment.securitySchemes },
            };
            const changes = yield (0, openapi_1.breakingChanges)(clientSchema, serverSchema);
            return changes.map((change) => ({
                event,
                message: changeMessage(change),
            }));
        });
    }
    return {
        matcher,
        where: (e) => !!e.httpClientRequest && !!e.httpClientRequest.url,
    };
}
const RULE = {
    id: 'incompatible-http-client-request',
    title: 'Incompatible HTTP client request',
    // scope: //http_client_request
    scope: 'http_client_request',
    enumerateScope: false,
    impactDomain: 'Stability',
    description: (0, parseRuleDescription_1.default)('incompatibleHttpClientRequest'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#incompatible-http-client-request',
    Options,
    build,
};
exports.default = RULE;
