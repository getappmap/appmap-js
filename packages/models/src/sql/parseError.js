export default class ParseError extends Error {
  constructor(message, sql) {
    super(message);

    this.sql = sql;
  }

  toString() {
    return `Unable to parse ${this.sql} : ${this.message}`;
  }
}
