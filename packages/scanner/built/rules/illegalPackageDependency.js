"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const matchPattern_1 = require("./lib/matchPattern");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
class Options {
    constructor() {
        this.callerPackages = [];
        this.calleePackage = {};
    }
}
function build(options) {
    const callerPatterns = (0, matchPattern_1.buildFilters)(options.callerPackages || []);
    const calleePattern = (0, matchPattern_1.buildFilter)(options.calleePackage);
    function where(e) {
        return !!e.parent && !!e.parent.codeObject.packageOf && calleePattern(e.codeObject.packageOf);
    }
    function matcher(e) {
        const parent = e.parent;
        if (!parent)
            return;
        const packageNamesStr = options.callerPackages
            .map((config) => config.equal || config.include || config.match)
            .map(String)
            .join(' or ');
        const parentPackage = parent.codeObject.packageOf;
        if (!(e.codeObject.packageOf === parentPackage ||
            callerPatterns.some((pattern) => pattern(parentPackage)))) {
            return [
                {
                    event: e,
                    message: `Code object ${e.codeObject.id} was invoked from ${parentPackage}, not from ${packageNamesStr}`,
                    participatingEvents: { parent },
                },
            ];
        }
    }
    return { where, matcher };
}
const RULE = {
    id: 'illegal-package-dependency',
    title: 'Illegal use of code by a non-whitelisted package',
    // scope: //*[@command]
    scope: 'command',
    enumerateScope: true,
    impactDomain: 'Maintainability',
    references: {
        'CWE-1120': new url_1.URL('https://cwe.mitre.org/data/definitions/1120.html'),
        'CWE-1154': new url_1.URL('https://cwe.mitre.org/data/definitions/1154.html'),
    },
    description: (0, parseRuleDescription_1.default)('illegalPackageDependency'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#illegal-package-dependency',
    Options,
    build,
};
exports.default = RULE;
