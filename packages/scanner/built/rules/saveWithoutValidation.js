"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
const validatedBy = (iterator) => {
    let i = iterator.next();
    while (!i.done) {
        if (i.value.event.methodId !== undefined &&
            ['valid?', 'validate'].includes(i.value.event.methodId) // TODO: change this to use labels
        ) {
            return true;
        }
        i = iterator.next();
    }
    return false;
};
function build() {
    return {
        matcher: (event) => !validatedBy(new models_1.EventNavigator(event).descendants()),
        where: (e) => e.isFunction && ['save', 'save!'].includes(e.methodId),
    };
}
const RULE = {
    id: 'save-without-validation',
    title: 'Save without validation',
    enumerateScope: true,
    impactDomain: 'Stability',
    references: {
        'CWE-20': new url_1.URL('https://cwe.mitre.org/data/definitions/20.html'),
    },
    description: (0, parseRuleDescription_1.default)('saveWithoutValidation'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#save-without-validation',
    build,
};
exports.default = RULE;
