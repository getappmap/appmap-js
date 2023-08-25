"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wellKnownLabels_1 = __importDefault(require("../wellKnownLabels"));
const sqlTransactionScope_1 = require("../scope/sqlTransactionScope");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
function build() {
    function matcher(event) {
        if (!(0, sqlTransactionScope_1.hasTransactionDetails)(event))
            throw new Error(`expected event ${event.id} to be a transaction`);
        if (event.transaction.status === 'commit')
            return;
        const creationEvents = event.transaction.events.filter(({ labels }) => labels.has(wellKnownLabels_1.default.JobCreate));
        const cancellationEvents = event.transaction.events.filter(({ labels }) => labels.has(wellKnownLabels_1.default.JobCancel));
        const missing = creationEvents.length - cancellationEvents.length;
        if (missing === 0)
            return;
        const result = {
            event: event,
            message: `${missing} jobs are scheduled but not cancelled in a rolled back transaction`,
            // if there's a mismatch and there are cancellations we can't tell
            // for sure which creations they match, so return everything
            relatedEvents: [...creationEvents, ...cancellationEvents],
        };
        return [result];
    }
    return {
        matcher,
    };
}
const RULE = {
    id: 'job-not-cancelled',
    title: 'Job created in a rolled back transaction and not cancelled',
    scope: 'transaction',
    enumerateScope: false,
    labels: [wellKnownLabels_1.default.JobCreate, wellKnownLabels_1.default.JobCancel],
    impactDomain: 'Stability',
    references: {
        'CWE-672': new url_1.URL('https://cwe.mitre.org/data/definitions/672.html'),
    },
    description: (0, parseRuleDescription_1.default)('jobNotCancelled'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#job-not-cancelled',
    build,
};
exports.default = RULE;
