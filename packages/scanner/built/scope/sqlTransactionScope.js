"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTransactionDetails = void 0;
const models_1 = require("@appland/models");
const scopeIterator_1 = __importDefault(require("./scopeIterator"));
function isBegin(ast) {
    switch (ast.variant) {
        case 'list':
            return ast.statement.some((s) => isBegin(s));
        case 'transaction':
            return ast.action === 'begin';
        default:
            return false;
    }
}
function isEnd(ast) {
    switch (ast.variant) {
        case 'list':
            for (const statement of ast.statement) {
                const result = isEnd(statement);
                if (result)
                    return result;
            }
            return undefined;
        case 'transaction':
            return ast.action === 'begin' ? undefined : ast;
        default:
            return undefined;
    }
}
function hasTransactionDetails(event) {
    return event.transaction !== undefined;
}
exports.hasTransactionDetails = hasTransactionDetails;
function iterateTransaction(begin, tail) {
    // since we can only go through the tail once,
    // we have to keep the list of events in the transaction
    const transaction = [begin];
    for (let next = tail.next(); !next.done; next = tail.next()) {
        const event = next.value;
        if (!event.isCall())
            continue;
        transaction.push(event);
        if (!event.sql)
            continue;
        // TODO: This should be routing through the AppMapIndex AST cache.
        const sql = (0, models_1.parseSQL)(event.sql.sql);
        if (!sql)
            continue;
        // This is normally a noop which generates a SQL warning.
        // It can also happen if there's more than one SQL connection used
        // and the new transaction is open in a different one than before.
        // We currently don't track the separate connections, so we have to
        // assume this is the same one and issue a warning.
        if (isBegin(sql))
            console.warn(`SQL transaction started within a transaction in event ${event.id}`);
        const end = isEnd(sql);
        if (end) {
            begin.transaction = { status: end.action, events: transaction };
            break;
        }
    }
    if (!begin.transaction) {
        // Transaction was still active at the end of appmap;
        // assume it was aborted.
        begin.transaction = { status: 'rollback', events: transaction };
    }
    return {
        scope: begin,
        events: transaction[Symbol.iterator].bind(transaction),
    };
}
class SQLTransactionScope extends scopeIterator_1.default {
    *scopes(events) {
        for (const event of events) {
            if (!event.isCall() || !event.sql)
                continue;
            const sql = (0, models_1.parseSQL)(event.sql.sql);
            if (sql && isBegin(sql) && !isEnd(sql)) {
                yield iterateTransaction(event, events);
            }
        }
    }
}
exports.default = SQLTransactionScope;
