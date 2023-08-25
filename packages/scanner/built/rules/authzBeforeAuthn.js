"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const util_1 = require("./lib/util");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
function containsAuthentication(events) {
    for (const iter of events) {
        if ((0, util_1.providesAuthentication)(iter.event, SecurityAuthentication)) {
            return true;
        }
    }
    return false;
}
function build() {
    function matcher(rootEvent) {
        for (const event of new models_1.EventNavigator(rootEvent).descendants()) {
            if ((0, util_1.providesAuthentication)(event.event, SecurityAuthentication)) {
                return;
            }
            if (event.event.labels.has(SecurityAuthorization) && (0, util_1.isTruthy)(event.event.returnValue)) {
                // If the authorization event has a successful authentication descendant, allow this as well.
                if (containsAuthentication(event.descendants())) {
                    return;
                }
                else {
                    return [
                        {
                            event: event.event,
                            message: `${event.event} provides authorization, but the request is not authenticated`,
                            participatingEvents: { request: rootEvent },
                        },
                    ];
                }
            }
        }
    }
    return { matcher };
}
const SecurityAuthentication = 'security.authentication';
const SecurityAuthorization = 'security.authorization';
const RULE = {
    id: 'authz-before-authn',
    title: 'Authorization performed before authentication',
    labels: [SecurityAuthorization, SecurityAuthentication],
    scope: 'http_server_request',
    impactDomain: 'Security',
    enumerateScope: false,
    references: {
        'CWE-863': new url_1.URL('https://cwe.mitre.org/data/definitions/863.html'),
    },
    description: (0, parseRuleDescription_1.default)('authzBeforeAuthn'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#authz-before-authn',
    build,
};
exports.default = RULE;
