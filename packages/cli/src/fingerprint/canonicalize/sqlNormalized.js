/* eslint-disable class-methods-use-this */
const { normalizeSQL } = require('@appland/models');
const Unique = require('./unique');

/**
 * At INFO level, the order of labeled function calls matters. SQL query strings
 * are collected, sorted and made unique.
 */
class Canonicalize extends Unique {
  /**
   *
   * @param {Event} event
   */
  sql(event) {
    return normalizeSQL(event.sqlQuery, event.sql.database_type);
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();
