import { warn } from 'node:console';
import { platform } from 'node:os';

function normalizePath(location: string): string {
  if (platform() !== 'win32') return location;

  // This fixes up a few issues observed with Windows paths:
  // 1. Leading slashes can be present in the path. This is likely an artifact of how the path is
  //    constructed in the client (e.g., via a file scheme URI).
  // 2. Drive letters are down cased. Again, likely due to file URIs.
  // 3. Path separators are normalized to backslashes.
  //
  // These cases originate from both JetBrains and VSCode. It'd be better to fix them at the source,
  // though fixing it here leaves no room for version mismatches.
  return location
    .replace(/\//g, '\\')
    .replace(/^(\\+)?(\w:)/, (_, __, driveLetter: string) => driveLetter.toUpperCase());
}

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
    const snippet = lines.slice(Math.max(start - 1, 0), end || lines.length);
    return snippet.join('\n');
  }

  toString(): string {
    return this.lineRange ? `${this.path}:${this.lineRange}` : this.path;
  }

  static parse(location: string): Location {
    const normalizedLocation = normalizePath(location);
    const match = normalizedLocation.match(/^(.+?)(?::(\d+)(?:-(\d+)?)?)?$/);
    if (!match) {
      // This should never happen. `normalizedLocation` would need to be empty.
      return new Location(normalizedLocation);
    }

    const [, filePath, start, end] = match;
    const startValid = start && !Number.isNaN(parseInt(start, 10));
    if (startValid) {
      const endValid = end && !Number.isNaN(parseInt(end, 10));
      const range = endValid ? `${start}-${end}` : start;
      return new Location(filePath, range);
    }
    return new Location(filePath);
  }
}

// Note this is somewhat of a tradeoff between speed and cost.
// The client can always request additional lines.
const MAX_BYTES = 20_000;
