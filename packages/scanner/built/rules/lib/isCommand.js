"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isCommand(event) {
    let label;
    if (event.labels.has('command'))
        label = 'command';
    else if (event.labels.has('job'))
        label = 'job';
    else if (event.httpServerRequest)
        label = 'request';
    return label;
}
exports.default = isCommand;
