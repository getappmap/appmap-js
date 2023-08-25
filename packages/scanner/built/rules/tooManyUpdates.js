"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
// TODO: Use the Query AST for this.
const QueryIncludes = [/\bINSERT\b/i, /\bUPDATE\b/i];
const UpdateMethods = ['put', 'post', 'patch'];
class Options {
    constructor() {
        this.warningLimit = 20;
    }
}
function build(options) {
    const isUpdate = (event) => {
        const isSQLUpdate = () => {
            if (!event.sqlQuery) {
                return false;
            }
            return QueryIncludes.some((pattern) => pattern.test(event.sqlQuery));
        };
        const isRPCUpdate = () => {
            if (!event.httpClientRequest) {
                return false;
            }
            return UpdateMethods.includes(event.httpClientRequest.request_method.toLowerCase());
        };
        return isSQLUpdate() || isRPCUpdate();
    };
    const updateEvents = function* (event) {
        for (const e of new models_1.EventNavigator(event).descendants()) {
            if (!isUpdate(e.event)) {
                continue;
            }
            yield e.event;
        }
    };
    function matcher(command) {
        const events = [];
        for (const updateEvent of updateEvents(command)) {
            events.push(updateEvent);
        }
        if (events.length > options.warningLimit) {
            return [
                {
                    message: `Command performs ${events.length} SQL and RPC updates`,
                    event: events[0],
                    relatedEvents: events,
                },
            ];
        }
    }
    return {
        matcher,
    };
}
const RULE = {
    id: 'too-many-updates',
    title: 'Too many SQL and RPC updates performed in one command',
    scope: 'command',
    enumerateScope: false,
    impactDomain: 'Maintainability',
    references: {
        'CWE-1048': new url_1.URL('https://cwe.mitre.org/data/definitions/1048.html'),
    },
    description: (0, parseRuleDescription_1.default)('tooManyUpdates'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#too-many-updates',
    Options,
    build,
};
exports.default = RULE;
