"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneEvent = exports.cloneCodeObject = void 0;
const models_1 = require("@appland/models");
function cloneCodeObject(sourceObject) {
    const codeObjects = [
        sourceObject,
        ...sourceObject.ancestors(),
    ];
    let currentSourceObject = codeObjects.pop();
    let lastClonedObject;
    while (currentSourceObject) {
        lastClonedObject = new models_1.CodeObject(currentSourceObject.data, lastClonedObject);
        currentSourceObject = codeObjects.pop();
    }
    return lastClonedObject;
}
exports.cloneCodeObject = cloneCodeObject;
// FIXME: These methods should live in @appland/models. Perhaps via Event#clone.
function cloneEvent(sourceEvent) {
    // We need to clone both the sourceEvent and the 'linkedEvent'. The linkedEvent will be a return
    // if `sourceEvent` is a call and vice versa. Some accessors on the Event will use the linkedEvent
    // as a convienence, so we may run into errors if we don't restore this relationship. For example,
    // accessing `elapsedTime` on a call event will retrieve the value from the associated return
    // event.
    const linkedEvent = new models_1.Event(sourceEvent.linkedEvent);
    const event = new models_1.Event(sourceEvent);
    event.linkedEvent = linkedEvent;
    // The codeObject is used as well so it'll need a clone.
    const codeObject = cloneCodeObject(sourceEvent.codeObject);
    if (codeObject) {
        event.codeObject = codeObject;
    }
    return event;
}
exports.cloneEvent = cloneEvent;
