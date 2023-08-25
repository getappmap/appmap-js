"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
const precedingEvents_1 = __importDefault(require("./lib/precedingEvents"));
const sanitizesData_1 = __importDefault(require("./lib/sanitizesData"));
function allArgumentsSanitized(rootEvent, event) {
    return (event.parameters || [])
        .filter((parameter) => parameter.object_id)
        .every((parameter) => {
        for (const candidate of (0, precedingEvents_1.default)(rootEvent, event)) {
            if ((0, sanitizesData_1.default)(candidate.event, parameter.object_id, ExecSanitize)) {
                return true;
            }
        }
        return false;
    });
}
function build() {
    function matcher(rootEvent) {
        for (const event of new models_1.EventNavigator(rootEvent).descendants()) {
            if (event.event.labels.has(Exec) &&
                !event.event.ancestors().find((ancestor) => ancestor.labels.has(ExecSafe))) {
                if (allArgumentsSanitized(rootEvent, event.event)) {
                    return;
                }
                else {
                    return [
                        {
                            event: event.event,
                            message: `${event.event} executes an untrusted command string`,
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
const Exec = 'system.exec';
const ExecSafe = 'system.exec.safe';
const ExecSanitize = 'system.exec.sanitize';
const RULE = {
    id: 'exec-of-untrusted-command',
    title: 'Execution of untrusted system command',
    labels: [Exec, ExecSafe, ExecSanitize],
    impactDomain: 'Security',
    enumerateScope: false,
    references: {
        'CWE-78': new url_1.URL('https://cwe.mitre.org/data/definitions/78.html'),
    },
    description: (0, parseRuleDescription_1.default)('execOfUntrustedCommand'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#exec-of-untrusted-command',
    build,
};
exports.default = RULE;
