"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const scopeIterator_1 = __importDefault(require("./scopeIterator"));
class ScopeImpl {
    constructor(event) {
        this.scope = event;
        this.descendants = new models_1.EventNavigator(event);
    }
    *events() {
        yield this.scope;
        for (const event of this.descendants.descendants()) {
            yield event.event;
        }
    }
}
const Command = 'command.perform';
const Job = 'job.perform';
class CommandScope extends scopeIterator_1.default {
    *scopes(events) {
        let found = false;
        const roots = [];
        for (const event of events) {
            if (event.isCall() && !event.parent) {
                roots.push(event);
            }
            if (event.isCall() &&
                (event.codeObject.labels.has(Command) ||
                    event.codeObject.labels.has(Job) ||
                    event.httpServerRequest)) {
                found = true;
                yield new ScopeImpl(event);
                this.advanceToReturnEvent(event, events);
            }
        }
        // If no true command is found, yield all root events.
        if (!found) {
            for (let index = 0; index < roots.length; index++) {
                const event = roots[index];
                yield new ScopeImpl(event);
            }
        }
    }
}
exports.default = CommandScope;
