"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Builds a function that returns true if the provided event argument has the specified
// objectId as the receiver or as a parameter value.
exports.default = (objectId) => {
    return (event) => (!!event.receiver && event.receiver.object_id === objectId) ||
        (!!event.parameters && event.parameters.some((param) => param.object_id === objectId));
};
