"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const secretsRegexes_1 = __importStar(require("../analyzer/secretsRegexes"));
const util_1 = require("./lib/util");
const recordSecrets_1 = __importDefault(require("../analyzer/recordSecrets"));
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
class Match {
    constructor(pattern, value, generatorEvent) {
        this.pattern = pattern;
        this.value = value;
        this.generatorEvent = generatorEvent;
    }
    static fromPattern(pattern, value) {
        return new Match(pattern, value);
    }
    static fromSecret(secret, value) {
        return new Match(secret.value, value, secret.generatorEvent);
    }
}
const secrets = [];
const findInLog = (event) => {
    if (!event.parameters)
        return;
    const matches = [];
    for (const { value } of event.parameters) {
        if ((0, util_1.emptyValue)(value))
            continue;
        if ((0, secretsRegexes_1.looksSecret)(value)) {
            // Only look for the exact matching regexes if it matches the catchall regex
            matches.push(...Object.values(secretsRegexes_1.default)
                .flat()
                .filter((re) => re.test(value))
                .map((re) => Match.fromPattern(re, value)));
        }
        for (const secret of secrets) {
            if (value.includes(secret.value)) {
                matches.push(Match.fromSecret(secret, value));
            }
        }
    }
    if (matches.length > 0) {
        return matches.map((match) => {
            const { pattern, value } = match;
            const participatingEvents = {};
            if (match.generatorEvent) {
                participatingEvents.generatorEvent = match.generatorEvent;
            }
            return {
                event,
                message: `Log message contains secret ${match.generatorEvent ? match.generatorEvent.codeObject.prettyName || 'data' : 'data'} "${pattern}": ${value}`,
                participatingEvents,
            };
        });
    }
};
function build() {
    return {
        matcher: (e) => {
            if (e.codeObject.labels.has(Secret)) {
                (0, recordSecrets_1.default)(secrets, e);
            }
            if (e.codeObject.labels.has(Log)) {
                return findInLog(e);
            }
        },
        where: (e) => {
            return e.codeObject.labels.has(Log) || e.codeObject.labels.has(Secret);
        },
    };
}
const Secret = 'secret';
const Log = 'log';
const RULE = {
    id: 'secret-in-log',
    title: 'Secret in log',
    labels: [Secret, Log],
    scope: 'root',
    impactDomain: 'Security',
    enumerateScope: true,
    references: {
        'CWE-532': new url_1.URL('https://cwe.mitre.org/data/definitions/532.html'),
    },
    description: (0, parseRuleDescription_1.default)('secretInLog'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#secret-in-log',
    build,
};
exports.default = RULE;
