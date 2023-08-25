"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFilters = exports.buildFilter = void 0;
const matchPattern_1 = require("./matchPattern");
function buildFilter(pattern) {
    const testFn = (0, matchPattern_1.buildFilter)(pattern.test);
    const propertyFn = {
        id: (e) => e.codeObject.id,
        type: (e) => e.codeObject.type,
        fqid: (e) => e.codeObject.fqid,
        query: (e, appMapIndex) => (e.sql ? appMapIndex.sqlNormalized(e) : null),
        route: (e) => e.route,
    };
    return (event, appMapIndex) => {
        const fn = propertyFn[pattern.property];
        if (!fn) {
            throw new Error(`Unrecognized Event filter property: ${pattern.property}`);
        }
        const value = fn(event, appMapIndex);
        if (!value) {
            return false;
        }
        return testFn(value);
    };
}
exports.buildFilter = buildFilter;
function buildFilters(patterns) {
    return patterns.map(buildFilter);
}
exports.buildFilters = buildFilters;
