"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const database_1 = require("../../database");
const matchPattern_1 = require("../lib/matchPattern");
function rule(options) {
    const excludeTables = (0, matchPattern_1.buildFilters)(options.excludeTables);
    function filterTable(table) {
        (0, assert_1.default)(table.type === 'identifier');
        (0, assert_1.default)(table.variant === 'table');
        return !excludeTables.find((filter) => filter(table.name));
    }
    // TODO: clean up (https://github.com/getappmap/scanner/issues/43)
    function matcher(command, appMapIndex, eventFilter) {
        const joinCount = {};
        for (const sqlEvent of (0, database_1.sqlStrings)(command, appMapIndex, eventFilter)) {
            let occurrence = joinCount[sqlEvent.sql];
            if (!occurrence) {
                const sqlAST = appMapIndex.sqlAST(sqlEvent.event);
                occurrence = {
                    count: 1,
                    joins: (0, database_1.countJoins)(sqlAST, filterTable),
                    events: [sqlEvent.event],
                };
                joinCount[sqlEvent.sql] = occurrence;
            }
            else {
                occurrence.count += 1;
                occurrence.events.push(sqlEvent.event);
            }
        }
        return Object.keys(joinCount).reduce((matchResults, sql) => {
            const occurrence = joinCount[sql];
            if (occurrence.joins >= options.warningLimit) {
                matchResults.push({
                    event: occurrence.events[0],
                    message: `${occurrence.joins} join${occurrence.joins > 1 ? 's' : ''} in SQL "${sql}"`,
                    relatedEvents: occurrence.events,
                });
            }
            return matchResults;
        }, []);
    }
    return {
        matcher,
    };
}
exports.default = rule;
