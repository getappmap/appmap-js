"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxMSBetween = void 0;
exports.MaxMSBetween = 10 * 1000;
// TODO: Unify with the code in packages/cli - find a way to make a common import.
class EventAggregator {
    constructor(callback, maxMsBetween = exports.MaxMSBetween) {
        this.callback = callback;
        this.maxMsBetween = maxMsBetween;
        this.pending = [];
        process.on('beforeExit', () => {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.emitPending();
            }
        });
    }
    push(emitter, event, arg) {
        this.pending.push({ emitter, event, arg });
        this.refresh();
    }
    refresh() {
        if (this.timeout)
            clearTimeout(this.timeout);
        this.timeout = setTimeout(this.emitPending.bind(this), this.maxMsBetween).unref();
    }
    emitPending() {
        this.callback(this.pending);
        this.timeout = undefined;
        this.pending = [];
    }
    attach(emitter, event) {
        const listenerFn = (...args) => {
            this.push(emitter, event, args[0]);
        };
        emitter.addListener(event, listenerFn);
        return () => emitter.removeListener(event, listenerFn);
    }
}
exports.default = EventAggregator;
