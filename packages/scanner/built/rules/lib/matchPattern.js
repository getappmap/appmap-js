"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFilters = exports.buildFilter = void 0;
function buildFilter(pattern) {
    function respectIgnoreCaseFlag(value) {
        return pattern.ignoreCase ? value.toLocaleLowerCase() : value;
    }
    if (pattern.equal) {
        const testStr = respectIgnoreCaseFlag(pattern.equal);
        return (value) => respectIgnoreCaseFlag(value) === testStr;
    }
    else if (pattern.include) {
        const testStr = respectIgnoreCaseFlag(pattern.include);
        return (value) => respectIgnoreCaseFlag(value).includes(testStr);
    }
    else {
        const regexp = pattern.match instanceof RegExp
            ? pattern.match
            : new RegExp(pattern.match, pattern.ignoreCase ? 'i' : undefined);
        return (value) => regexp.test(value);
    }
}
exports.buildFilter = buildFilter;
function buildFilters(patterns) {
    return patterns.map(buildFilter);
}
exports.buildFilters = buildFilters;
