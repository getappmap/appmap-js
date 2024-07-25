// Match locations like:
//  - path/to/file.rb
//  - path/to/file.rb:1
//  - path/to/file.rb:1-2
//  - c:/path/to/file.rb:1
const LOCATION_REGEXP = /^([a-zA-Z]:)?([^:]+)(:\d+(-\d+)?)?$/;

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

  static parse(location: string): Location | undefined {
    const match = LOCATION_REGEXP.exec(location);
    if (!match) return undefined;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, drive, path, lineRange] = match;
    const fullPath = drive ? `${drive}${path}` : path;

    // Strip any starting ':' character.
    const normalizedLineRange = lineRange ? lineRange.replace(/^:/, '') : undefined;

    return new Location(fullPath, normalizedLineRange);
  }
}
