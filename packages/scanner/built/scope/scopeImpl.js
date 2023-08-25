"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
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
exports.default = ScopeImpl;
