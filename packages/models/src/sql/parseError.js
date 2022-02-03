export default class ParseError extends Error {
  constructor(message, sql) {
    super(message);

    this.sql = sql;
  }

  toString() {
    return `${this.message}: ${this.sql}`;
  }
}
