"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@appland/models");
const lru_cache_1 = __importDefault(require("lru-cache"));
const NormalizedSQLBySQLString = new lru_cache_1.default({ max: 10000 });
const ASTBySQLString = new lru_cache_1.default({ max: 1000 });
class AppMapIndex {
    constructor(appMap) {
        this.appMap = appMap;
    }
    sqlAST(event) {
        if (!event.sql)
            throw new Error(`${event.fqid} is not a SQL query`);
        const sql = this.sqlNormalized(event);
        let result;
        const cachedAST = ASTBySQLString.get(sql);
        if (cachedAST === 'parse-error') {
            result = undefined;
        }
        else if (cachedAST) {
            result = cachedAST;
        }
        else {
            result = (0, models_1.parseSQL)(sql);
            ASTBySQLString.set(sql, result ? result : 'parse-error');
        }
        return result;
    }
    sqlNormalized(event) {
        if (!event.sql)
            throw new Error(`${event.fqid} is not a SQL query`);
        const cacheKey = [event.sql.database_type, event.sql.sql].join(':');
        let sql = NormalizedSQLBySQLString.get(cacheKey);
        if (!sql) {
            sql = (0, models_1.normalizeSQL)(event.sql.sql, event.sql.database_type);
            NormalizedSQLBySQLString.set(cacheKey, sql);
        }
        return sql;
    }
}
exports.default = AppMapIndex;
