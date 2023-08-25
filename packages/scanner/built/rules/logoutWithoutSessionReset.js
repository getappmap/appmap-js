"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
function containsSessionClear(events) {
    for (const iter of events) {
        if (iter.event.labels.has(HTTPSessionClear)) {
            return true;
        }
    }
    return false;
}
function build() {
    function matcher(rootEvent) {
        for (const event of new models_1.EventNavigator(rootEvent).descendants()) {
            // .//*[@security.logout]
            if (event.event.labels.has(SecurityLogout)) {
                // .//*[@http.session.clear]
                if (containsSessionClear(event.descendants())) {
                    return;
                }
                else {
                    return [
                        {
                            event: event.event,
                            message: `${event.event} logs out the user, but the HTTP session is not cleared`,
                            participatingEvents: { request: rootEvent },
                        },
                    ];
                }
            }
        }
    }
    return {
        matcher,
    };
}
const SecurityLogout = 'security.logout';
const HTTPSessionClear = 'http.session.clear';
const RULE = {
    id: 'logout-without-session-reset',
    title: 'Logout without session reset',
    scope: 'http_server_request',
    labels: [HTTPSessionClear, SecurityLogout],
    impactDomain: 'Security',
    enumerateScope: false,
    references: {
        'CWE-488': new url_1.URL('https://cwe.mitre.org/data/definitions/488.html'),
        'OWASP - Session fixation': new url_1.URL('https://owasp.org/www-community/attacks/Session_fixation'),
        'Ruby on Rails - Session fixation countermeasures': new url_1.URL('https://guides.rubyonrails.org/security.html#session-fixation-countermeasures'),
    },
    description: (0, parseRuleDescription_1.default)('logoutWithoutSessionReset'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#logout-without-session-reset',
    build,
};
exports.default = RULE;
