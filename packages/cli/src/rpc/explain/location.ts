export default class Location {
  constructor(public path: string, public lineRange?: string) {}

  snippet(contents: string): string {
    if (!this.lineRange) return contents;

    const [start, end] = this.lineRange.split('-').map(Number);

    const lines = contents.split('\n');
    const snippet = lines.slice(start - 1, end || lines.length);
    return snippet.join('\n');
  }

  toString(): string {
    return this.lineRange ? `${this.path}:${this.lineRange}` : this.path;
  }

  static parse(location: string): Location {
    const tokens = location.split(':');
    if (tokens.length === 1) return new Location(tokens[0]);

    // Determine if the line range is of the form `:line` or `:start-end`.
    const rangeTokens = tokens[tokens.length - 1].split('-');
    // See if they are all integers, by actually parsing them.
    const isLineRange =
      rangeTokens.length < 3 && rangeTokens.every((token) => !Number.isNaN(Number(token)));
    if (!isLineRange) return new Location(location);

    const path = tokens.slice(0, tokens.length - 1).join(':');
    const lineRange = tokens[tokens.length - 1];
    return new Location(path, lineRange);
  }
}
