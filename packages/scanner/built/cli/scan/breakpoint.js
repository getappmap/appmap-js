"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakOnCodeObject = exports.BreakOnLabel = exports.BreakOnEvent = exports.BreakOnCounter = void 0;
class BreakOnCounter {
    constructor(counter) {
        this.counter = counter;
    }
    condition(context) {
        return this.counter === context.counter;
    }
    toString() {
        return `(${this.counter})`;
    }
}
exports.BreakOnCounter = BreakOnCounter;
class BreakOnEvent {
    constructor(eventName) {
        this.eventName = makeRegularExpression(eventName);
    }
    condition(context) {
        return this.eventName.test(context.eventName);
    }
    toString() {
        return this.eventName.toString();
    }
}
exports.BreakOnEvent = BreakOnEvent;
class BreakOnLabel {
    constructor(label) {
        this.label = makeRegularExpression(label);
    }
    condition(context) {
        if (!context.event)
            return false;
        return !![...context.event.codeObject.labels].find((label) => this.label.test(label));
    }
    toString() {
        return this.label.toString();
    }
}
exports.BreakOnLabel = BreakOnLabel;
class BreakOnCodeObject {
    constructor(codeObject) {
        this.codeObject = makeRegularExpression(codeObject);
    }
    condition(context) {
        if (!context.event)
            return false;
        return this.codeObject.test(context.event.codeObject.fqid);
    }
    toString() {
        return this.codeObject.toString();
    }
}
exports.BreakOnCodeObject = BreakOnCodeObject;
function escapeRegexp(expr) {
    return new RegExp(expr.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
}
function makeRegularExpression(expr) {
    if (expr.length < 2)
        return escapeRegexp(expr);
    if (expr.startsWith('/') && expr.endsWith('/'))
        return new RegExp(expr);
    return escapeRegexp(expr);
}
