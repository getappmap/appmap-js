"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sanitizesData(event, objectId, label) {
    return (event.labels.has(label) &&
        !!event.returnValue &&
        !!event.returnValue.object_id &&
        event.returnValue.object_id === objectId);
}
exports.default = sanitizesData;
