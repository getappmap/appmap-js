"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../database");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
class Options {
    constructor() {
        this.warningLimit = 5;
        this.errorLimit = 10;
    }
}
function build(options) {
    function matcher(command, appMapIndex, eventFilter) {
        const sqlEvents = (0, database_1.sqlStrings)(command, appMapIndex, eventFilter);
        let sqlRollup = {};
        const eventsById = {};
        appMapIndex.appMap.events.forEach((event) => {
            eventsById[event.id] = event;
        });
        for (const sqlEvent of sqlEvents) {
            if (!sqlEvent.event.parent)
                continue;
            const key = [sqlEvent.event.parent.id, sqlEvent.sql].join('\n');
            sqlRollup[key] || (sqlRollup[key] = []);
            sqlRollup[key].push(sqlEvent);
        }
        const matchResults = [];
        do {
            [...Object.keys(sqlRollup)].forEach((key) => {
                const events = sqlRollup[key];
                const [ancestorId, sql] = key.split('\n');
                const ancestor = eventsById[parseInt(ancestorId)];
                const occurranceCount = events.length;
                if (occurranceCount > options.warningLimit) {
                    const participatingEvents = { commonAncestor: ancestor };
                    const buildMatchResult = (level) => {
                        return {
                            level: level,
                            event: events[0].event,
                            message: `${ancestor.toString()}[${ancestor.id}] contains ${occurranceCount} occurrences of SQL: ${sql}`,
                            groupMessage: sql,
                            occurranceCount: occurranceCount,
                            relatedEvents: events.map((e) => e.event),
                            participatingEvents,
                        };
                    };
                    if (occurranceCount >= options.errorLimit) {
                        matchResults.push(buildMatchResult('error'));
                    }
                    else if (occurranceCount >= options.warningLimit) {
                        matchResults.push(buildMatchResult('warning'));
                    }
                }
            });
            const newRollup = {};
            Object.keys(sqlRollup).forEach((key) => {
                const events = sqlRollup[key];
                if (events.length >= options.warningLimit)
                    return;
                const [ancestorId, sql] = key.split('\n');
                const ancestor = eventsById[parseInt(ancestorId)];
                if (ancestor.parent) {
                    const parentKey = [ancestor.parent.id, sql].join('\n');
                    newRollup[parentKey] = (newRollup[parentKey] || []).concat(events);
                }
            }, {});
            sqlRollup = newRollup;
        } while (Object.keys(sqlRollup).length > 0);
        return matchResults;
    }
    return {
        matcher,
    };
}
const RULE = {
    id: 'n-plus-one-query',
    title: 'N plus 1 SQL query',
    scope: 'command',
    impactDomain: 'Performance',
    enumerateScope: false,
    Options,
    references: {
        'CWE-1073': new url_1.URL('https://cwe.mitre.org/data/definitions/1073.html'),
    },
    description: (0, parseRuleDescription_1.default)('nPlusOneQuery'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#n-plus-one-query',
    build,
};
exports.default = RULE;
