const { normalizeSQL } = require('@appland/models');
const { obfuscate } = require('./database');
const { formatValue, formatHttpServerRequest } = require('./utils');

class FunctionStats {
  constructor(infos) {
    this.infos = infos;
  }

  toJSON() {
    return this.infos;
  }

  get count() {
    return this.infos.length;
  }

  get appMapNames() {
    return [...new Set(this.infos.map((e) => e.appmap))].sort();
  }

  get returnValues() {
    return [
      ...new Set(
        this.infos.map((e) => e.event.return.return_value).map(formatValue)
      ),
    ].sort();
  }

  get httpServerRequests() {
    return [
      ...new Set(
        this.infos
          .map((e) => e.ancestors.filter((a) => a.call.httpServerRequest))
          .flat()
          .map((e) => formatHttpServerRequest(e.call))
      ),
    ].sort();
  }

  get sqlQueries() {
    return [
      ...new Set(
        this.infos
          .map((e) => e.descendants.filter((d) => d.call.sql_query))
          .flat()
          .map((e) =>
            obfuscate(e.call.sql_query.sql, e.call.sql_query.database_type)
          )
      ),
    ].sort();
  }

  get sqlTables() {
    return [
      ...new Set(
        this.infos
          .map((e) => e.descendants.filter((d) => d.call.sql_query))
          .flat()
          .map((e) => normalizeSQL(e.call.sql_query.sql))
          .map((sql) => sql.tables)
          .flat()
      ),
    ].sort();
  }

  get callers() {
    return [
      ...new Set(
        this.infos
          .map((e) => e.caller)
          .filter((e) => e)
          .map((e) => e.call.isFunction && e.call.codeObject.id)
          .filter((e) => e)
      ),
    ];
  }

  get ancestors() {
    return [
      ...new Set(
        this.infos
          .map((e) => e.ancestors)
          .filter((list) => list.length > 0)
          .map((list) =>
            list.map((e) => e.call.isFunction && e.call.codeObject.id)
          )
          .flat()
          .filter((e) => e)
      ),
    ];
  }

  get descendants() {
    return [
      ...new Set(
        this.infos
          .map((e) => e.descendants)
          .filter((list) => list.length > 0)
          .map((list) =>
            list.map((e) => e.call.isFunction && e.call.codeObject.id)
          )
          .flat()
          .filter((e) => e)
      ),
    ];
  }
}

module.exports = FunctionStats;
