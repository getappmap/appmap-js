"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function matcher(event, appMapIndex) {
    if (!event.receiver)
        return;
    const objectId = event.receiver.object_id;
    const setAuthData = appMapIndex.appMap.events
        .filter((evt) => { var _a; return ((_a = evt.receiver) === null || _a === void 0 ? void 0 : _a.object_id) === objectId; })
        .find((evt) => evt.labels.has('crypto.set_auth_data'));
    if (!setAuthData) {
        return [
            {
                event,
                message: 'Encryption is not authenticated',
            },
        ];
    }
}
function rule() {
    return {
        matcher,
        where: (e) => e.labels.has('crypto.encrypt'),
    };
}
exports.default = rule;
