"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const recordSecrets_1 = __importDefault(require("../analyzer/recordSecrets"));
const secretsRegexes_1 = require("../analyzer/secretsRegexes");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
const BCRYPT_REGEXP = /^[$]2[abxy]?[$](?:0[4-9]|[12][0-9]|3[01])[$][./0-9a-zA-Z]{53}$/;
const secrets = [];
const secretStrings = new Set();
function stringEquals(e) {
    if (!e.parameters || !e.receiver || e.parameters.length !== 1) {
        return false;
    }
    const args = [e.receiver.value, e.parameters[0].value];
    function isBcrypt(str) {
        return BCRYPT_REGEXP.test(str);
    }
    function isSecret(str) {
        return secretStrings.has(str) || (0, secretsRegexes_1.looksSecret)(str);
    }
    // BCrypted strings are safe to compare using equals()
    return args.some(isSecret) && !args.some(isBcrypt);
}
function build() {
    function matcher(e) {
        if (e.codeObject.labels.has(Secret)) {
            const numSecrets = secrets.length;
            (0, recordSecrets_1.default)(secrets, e);
            for (let index = numSecrets; index < secrets.length; index++) {
                const secret = secrets[index];
                secretStrings.add(secret.value);
            }
        }
        if (e.codeObject.labels.has(StringEquals)) {
            return stringEquals(e);
        }
    }
    function where(e) {
        return (e.isFunction && (e.codeObject.labels.has(StringEquals) || e.codeObject.labels.has(Secret)));
    }
    return {
        matcher,
        where,
    };
}
const Secret = 'secret';
const StringEquals = 'string.equals';
const RULE = {
    id: 'insecure-compare',
    title: 'Insecure comparison of secrets',
    labels: [Secret, StringEquals],
    enumerateScope: true,
    impactDomain: 'Security',
    references: {
        'CWE-208': new url_1.URL('https://cwe.mitre.org/data/definitions/208.html'),
    },
    description: (0, parseRuleDescription_1.default)('insecureCompare'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#insecure-compare',
    build,
};
exports.default = RULE;
