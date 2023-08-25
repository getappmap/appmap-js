"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../rules/lib/util");
function default_1(secrets, e) {
    if (!e.returnValue) {
        return;
    }
    if ((0, util_1.emptyValue)(e.returnValue.value)) {
        return;
    }
    // For example, from Devise:
    // {"class":"Array","value":"[LoDbrVENxPDM3x9ySf1y, 706d0455f6ca78e6f61609e8146a76729ceca01b7e95ed0ac49d416e3e8be39a]"
    for (const secret of (0, util_1.parseValue)(e.returnValue)) {
        if ((0, util_1.verbose)()) {
            console.warn(`Secret generated: ${secret}`);
        }
        secrets.push({ generatorEvent: e, value: secret });
    }
}
exports.default = default_1;
