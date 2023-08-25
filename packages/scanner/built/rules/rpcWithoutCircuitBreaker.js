"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const rpcWithoutProtection_1 = require("./lib/rpcWithoutProtection");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
class Options {
    constructor() {
        this.expectedLabel = RPCCircuitBreaker;
    }
}
// The circuit breaker will be found in a descendant of the httpClientRequest.
function* descendants(httpClientRequest) {
    for (const candidate of new models_1.EventNavigator(httpClientRequest).descendants()) {
        yield candidate.event;
    }
}
function build(options = new Options()) {
    return (0, rpcWithoutProtection_1.rpcWithoutProtection)(descendants, options);
}
const RPCCircuitBreaker = 'rpc.circuit_breaker';
const RULE = {
    id: 'rpc-without-circuit-breaker',
    title: 'RPC without circuit breaker',
    Options,
    labels: [RPCCircuitBreaker],
    impactDomain: 'Stability',
    enumerateScope: true,
    description: (0, parseRuleDescription_1.default)('rpcWithoutCircuitBreaker'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#rpc-without-circuit-breaker',
    build,
};
exports.default = RULE;
