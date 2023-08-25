"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const sha256_1 = __importDefault(require("crypto-js/sha256"));
const assert_1 = __importDefault(require("assert"));
const crypto_1 = require("crypto");
// BEGIN COMMENT
// Moved here from packages/models, in order to retain backwards compatibility with Hash v1
// as the Event algoritms hash and identityHash are updated.
function qualifiedMethodId(event) {
    const { definedClass, isStatic, methodId } = event;
    (0, assert_1.default)(definedClass, 'Event.definedClass');
    return `${definedClass}${isStatic ? '.' : '#'}${methodId}`;
}
// Returns a string suitable for durable identification of a call event
// that's independent of parameters and return values.
// For SQL queries, it's a JSON of abstract query AST.
// For HTTP queries, it's the method plus normalized path info.
// For function calls it's the qualified function id.
// TODO: This can be removed/deprecated when the current hash algorithm is removed.
function callEventToString(event) {
    const { sqlQuery, route } = event;
    if (sqlQuery)
        return (0, models_1.abstractSqlAstJSON)(sqlQuery, event.sql.database_type);
    if (route)
        return route;
    return qualifiedMethodId(event);
}
// Returns a short string (hash) suitable for durable identification
// of a call event that's independent of parameters and return values.
// For SQL queries, it considers the abstract query (ignoring differences in literal values).
// For HTTP queries, it considers the method plus normalized path info.
// For function calls it's the qualified function id.
// Non-call events will throw an error.
function hashEvent(event) {
    if (event.event !== 'call')
        throw new Error('tried to hash a non-call event');
    return (0, sha256_1.default)(callEventToString(event)).toString();
}
// END COMMENT
class HashV1 {
    constructor(ruleId, findingEvent, relatedEvents) {
        this.hash = (0, crypto_1.createHash)('sha256');
        this.hash.update(hashEvent(findingEvent));
        this.hash.update(ruleId);
        // Admittedly odd, this implementation matches the original hash algorithm.
        const uniqueEvents = new Set();
        const hashEvents = [];
        relatedEvents.unshift(findingEvent);
        relatedEvents.forEach((event) => {
            if (uniqueEvents.has(event.id))
                return;
            uniqueEvents.add(event.id);
            hashEvents.push(event);
        });
        // This part where the hashes go into a Set, and there is some kind of ordering as a side-
        // effect, is particularly weird.
        new Set(hashEvents.map((e) => hashEvent(e))).forEach((eventHash) => {
            this.hash.update(eventHash);
        });
    }
    digest() {
        return this.hash.digest('hex');
    }
}
exports.default = HashV1;
