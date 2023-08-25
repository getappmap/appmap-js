"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
function* precedingEvents(rootEvent, target) {
    for (const event of new models_1.EventNavigator(rootEvent).descendants()) {
        if (event.event === target) {
            break;
        }
        yield event;
    }
}
exports.default = precedingEvents;
