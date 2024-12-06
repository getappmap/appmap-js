import { warn } from 'node:console';

export default class Location {
  constructor(public path: string, public lineRange?: string) {}

  snippet(contents: string): string {
    if (!this.lineRange) {
      if (contents.length > MAX_BYTES) {
        // collect only as many COMPLETE lines as will fit
        const lines = contents.split('\n');
        let bytes = 0;
        let i = 0;
        for (; i < lines.length; i++) {
          bytes += lines[i].length + 1;
          if (bytes > MAX_BYTES) break;
        }
        if (i === 0) i++; // at least one line
        warn(`Snippet too large, showing only ${i} lines`);
        // set the line range to reflect this
        this.lineRange = `1-${i}`;
        return lines.slice(0, i).join('\n');
      } else return contents;
    }

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

// Note this is somewhat of a tradeoff between speed and cost.
// The client can always request additional lines.
const MAX_BYTES = 20_000;
