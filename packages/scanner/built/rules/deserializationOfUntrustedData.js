"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
const analyzeDataFlow_1 = __importDefault(require("./lib/analyzeDataFlow"));
function valueHistory(value) {
    const events = [];
    const queue = [value];
    for (;;) {
        const current = queue.shift();
        if (!current)
            break;
        const { origin, parents } = current;
        if (!events.includes(origin))
            events.push(origin);
        queue.push(...parents);
    }
    return events;
}
function wasSanitized(value) {
    return valueHistory(value).some(({ labels }) => labels.has(DeserializeSanitize));
}
function formatHistories(values) {
    const histories = values.map(valueHistory);
    return Object.fromEntries(histories.flatMap((history, input) => history.map((event, idx) => [`origin[${input}][${idx}]`, event])));
}
function label(name) {
    return ({ labels }) => labels.has(name);
}
function matcher(startEvent) {
    const flow = (0, analyzeDataFlow_1.default)([...(startEvent.message || [])], startEvent);
    const results = [];
    const sanitizedValues = new Set();
    for (const [event, values] of flow) {
        if (event.labels.has(DeserializeSanitize)) {
            for (const v of values)
                sanitizedValues.add(v);
            continue;
        }
        if (!event.labels.has(DeserializeUnsafe))
            continue;
        const unsanitized = new Set(values.filter((v) => !(wasSanitized(v) || sanitizedValues.has(v))));
        // remove any that have been passed into a safe deserialization function
        for (const ancestor of event.ancestors().filter(label(DeserializeSafe))) {
            for (const v of flow.get(ancestor) || []) {
                unsanitized.delete(v);
            }
        }
        const remaining = [...unsanitized];
        if (remaining.length === 0)
            continue;
        results.push({
            event: event,
            message: `deserializes untrusted data: ${remaining.map(({ value: { value } }) => value)}`,
            participatingEvents: formatHistories(remaining),
        });
    }
    return results;
}
const DeserializeUnsafe = 'deserialize.unsafe';
const DeserializeSafe = 'deserialize.safe';
const DeserializeSanitize = 'deserialize.sanitize';
const RULE = {
    id: 'deserialization-of-untrusted-data',
    title: 'Deserialization of untrusted data',
    labels: [DeserializeUnsafe, DeserializeSafe, DeserializeSanitize],
    impactDomain: 'Security',
    enumerateScope: false,
    scope: 'http_server_request',
    references: {
        'CWE-502': new url_1.URL('https://cwe.mitre.org/data/definitions/502.html'),
        'Ruby Security': new url_1.URL('https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html'),
    },
    description: (0, parseRuleDescription_1.default)('deserializationOfUntrustedData'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#deserialization-of-untrusted-data',
    build: () => ({ matcher }),
};
exports.default = RULE;
