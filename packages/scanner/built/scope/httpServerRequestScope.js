"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const scopeImpl_1 = __importDefault(require("./scopeImpl"));
const scopeIterator_1 = __importDefault(require("./scopeIterator"));
class HTTPServerRequestScope extends scopeIterator_1.default {
    *scopes(events) {
        for (const event of events) {
            if (event.isCall() && event.httpServerRequest) {
                yield new scopeImpl_1.default(event);
                this.advanceToReturnEvent(event, events);
            }
        }
    }
}
exports.default = HTTPServerRequestScope;
