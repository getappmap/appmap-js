"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visit = void 0;
function visit(node, callbacks) {
    if (node === null)
        return;
    const { type, variant } = node;
    const key = [type, variant].filter(Boolean).join('.');
    if (key in callbacks) {
        const callback = callbacks[key];
        callback(node);
    }
    visitNode(node, callbacks);
}
exports.visit = visit;
function visitNode(node, callbacks) {
    for (const [key, property] of Object.entries(node)) {
        if (['type', 'variant', 'name', 'value'].includes(key))
            continue;
        if (Array.isArray(property)) {
            for (const subNode of property)
                visit(subNode, callbacks);
        }
        else if (typeof property === 'object') {
            visit(property, callbacks);
        }
        else if (typeof property === 'string' || typeof property === 'boolean') {
            // pass
        }
        else {
            console.warn(`Unrecognized subexpression: ${typeof property} ${property}`);
        }
    }
}
