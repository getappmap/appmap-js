"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ScopeIterator {
    // Scan ahead past the return event of the yielded scope.
    advanceToReturnEvent(scopeEvent, events) {
        // Don't use for...of events here, it doesn't work with an outer for...of on the same events generator.
        let eventResult = events.next();
        while (!eventResult.done) {
            const event = eventResult.value;
            if (event.isReturn() && event.callEvent === scopeEvent) {
                break;
            }
            eventResult = events.next();
        }
    }
}
exports.default = ScopeIterator;
