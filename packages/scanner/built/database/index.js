"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countJoins = exports.sqlStrings = exports.isSelect = exports.getSqlLabelFromString = exports.getHttpLabel = exports.capitalizeString = void 0;
const models_1 = require("@appland/models");
const visit_1 = require("./visit");
const url_1 = require("url");
function capitalizeString(str) {
    if (typeof str !== 'string') {
        return '';
    }
    return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}
exports.capitalizeString = capitalizeString;
function getHttpLabel(event) {
    if (!event.httpServerRequest) {
        return;
    }
    const requestMethod = event.httpServerRequest.request_method;
    const pathInfo = event.httpServerRequest.path_info;
    let label;
    try {
        // the url is fake, we only care about the path info anyway
        const url = new url_1.URL(pathInfo, 'http://hostname');
        label = `${requestMethod} ${url.pathname}`;
    }
    catch (ex) {
        label = 'HTTP Request';
    }
    return label;
}
exports.getHttpLabel = getHttpLabel;
const sqlLabels = new Set([
    'insert',
    'update',
    'select',
    'delete',
    'alter',
    'create',
    'drop',
    'rename',
    'truncate',
    'replace',
    'savepoint',
    'release',
    'rollback',
    'lock',
    'unlock',
    'set',
    'start',
    'call',
    'delete',
    'do',
    'perform',
    'handler',
    'load',
    'purge',
    'reset',
    'prepare',
    'execute',
    'deallocate',
    'xa',
]);
function getSqlLabelFromString(sqlString) {
    const sqlChars = [...sqlString.trimLeft()];
    if (sqlChars.length > 0 && sqlChars[0] === '(') {
        // if the query is wrapped in parenthesis, drop the opening parenthesis
        // it doesn't matter if we leave a hanging closing parenthesis.
        // e.g. (SELECT 1);
        sqlChars.shift();
    }
    // drop sub-queries and parenthesized expressions
    let depth = 0;
    const topLevelSql = sqlChars
        .reduce((arr, c) => {
        if (c === '(') {
            depth += 1;
        }
        if (depth === 0) {
            arr.push(c);
        }
        if (c === ')') {
            depth -= 1;
        }
        return arr;
    }, [])
        .join('');
    let queryType;
    if (topLevelSql.search(/\s/) === -1) {
        // There's only a single token
        // e.g. BEGIN, COMMIT, CHECKPOINT
        queryType = topLevelSql;
    }
    else {
        // convert non-word sequences to spaces and split by space
        // find the first known token
        queryType =
            topLevelSql
                .replace(/[^\w]+/g, ' ')
                .toLowerCase()
                .split(' ')
                .find((t) => sqlLabels.has(t)) || 'unknown';
    }
    return ['SQL', capitalizeString(queryType) || null].join(' ');
}
exports.getSqlLabelFromString = getSqlLabelFromString;
function isSelect(sql) {
    return getSqlLabelFromString(sql) === 'SQL Select';
}
exports.isSelect = isSelect;
function* sqlStrings(event, appMapIndex, filter = () => true) {
    for (const e of new models_1.EventNavigator(event).descendants()) {
        if (!e.event.sql) {
            continue;
        }
        if (!filter(e.event, appMapIndex)) {
            continue;
        }
        if (!isSelect(e.event.sqlQuery)) {
            continue;
        }
        if (!filter(event, appMapIndex)) {
            continue;
        }
        const sql = appMapIndex.sqlNormalized(e.event);
        yield { event: e.event, sql };
    }
}
exports.sqlStrings = sqlStrings;
function countJoins(ast, filterTable) {
    if (!ast)
        return 0;
    let joins = 0;
    (0, visit_1.visit)(ast, {
        'map.join': (node) => {
            var _a;
            const map = (_a = node.map) !== null && _a !== void 0 ? _a : [];
            const tableCount = filterTable
                ? map.filter((entry) => {
                    const source = entry === null || entry === void 0 ? void 0 : entry.source;
                    if (!source)
                        return true;
                    if (source.type !== 'identifier')
                        return true;
                    if (source.variant !== 'table')
                        return true;
                    return filterTable(source);
                }).length
                : map.length;
            joins += tableCount;
        },
    });
    return joins;
}
exports.countJoins = countJoins;
