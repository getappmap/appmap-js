"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureStack = void 0;
const crypto_1 = require("crypto");
const isCommand_1 = __importDefault(require("../../rules/lib/isCommand"));
const util_1 = require("../../rules/lib/util");
function hashEvent(entries, prefix, event) {
    Object.keys(event.stableProperties)
        .sort()
        .forEach((key) => entries.push([[prefix, key].join('.'), event.stableProperties[key].toString()].join('=')));
}
const STACK_DEPTH = 3;
/**
 * Captures stack entries from distinct packages. Ancestors of the event are traversed up to the
 * command or root. Then, starting from the command or root, subsequent events which come from the
 * same package as their preceding event are removed. Then the last N entries remaining in the
 * stack are collected.
 *
 * @param event leaf event
 * @param participatingEvents output collector
 * @param depth number of events to include in the output
 */
function captureStack(event, depth = STACK_DEPTH) {
    let ancestor = event.parent;
    const stack = [];
    while (ancestor) {
        stack.push(ancestor);
        ancestor = (0, isCommand_1.default)(ancestor) ? undefined : ancestor.parent;
    }
    const packageOf = (event) => {
        if (!event)
            return;
        if (event.codeObject.type !== 'function')
            return;
        return event.codeObject.packageOf;
    };
    return stack
        .filter((item, index) => item.codeObject.type !== 'function' || packageOf(stack[index + 1]) !== packageOf(item))
        .slice(0, depth);
}
exports.captureStack = captureStack;
/**
 * Builds a hash (digest) of a finding. The digest is constructed by first building a canonical
 * string of the finding, of the form:
 *
 * ```
 * [
 *   algorithmVersion=2
 *   rule=<rule-id>
 *   findingEvent.<property1>=value1
 *   ...
 *   findingEvent.<propertyN>=valueN
 *   participatingEvent.<eventName1>=value1
 *   ...
 *   participatingEvent.<eventName1>=valueN
 *   ...
 *   participatingEvent.<eventNameN>=value1
 *   ...
 *   participatingEvent.<eventNameN>=valueN
 *   stack[1]=value1
 *   ...
 *   stack[1]=valueN
 *   ...
 *   stack[3]=value1
 *   ...
 *   stack[3]=valueN
 * ]
 * ```
 *
 * Participating events are sorted by the event name. Properties of each event are sorted by
 * the property name. Event properties are provided by `Event#stableProperties`.
 *
 * The partial stack included in the finding hash removes subsequent function calls from the
 * same package.
 */
class HashV2 {
    constructor(ruleId, findingEvent, participatingEvents) {
        this.hashEntries = [];
        this.hash = (0, crypto_1.createHash)('sha256');
        const hashEntries = [
            ['algorithmVersion', '2'],
            ['rule', ruleId],
        ].map((e) => e.join('='));
        this.hashEntries = hashEntries;
        hashEvent(hashEntries, 'findingEvent', findingEvent);
        Object.keys(participatingEvents)
            .sort()
            .forEach((key) => {
            const event = participatingEvents[key];
            hashEvent(hashEntries, `participatingEvent.${key}`, event);
        });
        captureStack(findingEvent).forEach((event, index) => hashEvent(hashEntries, `stack[${index + 1}]`, event));
        if ((0, util_1.verbose)())
            console.log(hashEntries);
        hashEntries.forEach((e) => this.hash.update(e));
    }
    get canonicalString() {
        return this.hashEntries.join('\n');
    }
    digest() {
        return this.hash.digest('hex');
    }
}
exports.default = HashV2;
