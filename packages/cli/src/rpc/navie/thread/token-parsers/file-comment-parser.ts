import { URI } from '@appland/rpc';
import { ParseContextChanges, ParseResult, StreamingParser } from '.';

const START_PATTERN = '<!-- file:';
const END_PATTERN = '-->';
export const FileCommentParser: StreamingParser = {
  name: 'file comment',
  tryParse(buffer, context): ParseResult {
    let i = 0;
    let matchStart = -1;
    let j = 0;

    // Phase 1: Try to match the start pattern
    while (i < buffer.length && j < START_PATTERN.length) {
      if (buffer[i] === START_PATTERN[j]) {
        if (matchStart === -1) matchStart = i;
        i++;
        j++;
      } else {
        // Restart if mismatch after partial match
        if (matchStart !== -1) {
          matchStart = -1;
          j = 0;
        } else {
          i++;
        }
      }
    }

    // If we matched some of the START_PATTERN but not all
    if (j > 0 && j < START_PATTERN.length) {
      return {
        status: 'partial',
        firstPotentialMatchIndex: matchStart,
      };
    }

    // If full START_PATTERN matched
    if (j === START_PATTERN.length) {
      const fileStart = i;
      let fileEnd = -1;

      // Phase 2: Look for END_PATTERN
      while (i < buffer.length) {
        if (buffer.slice(i, i + END_PATTERN.length) === END_PATTERN) {
          fileEnd = i;
          break;
        }
        i++;
      }

      if (fileEnd === -1) {
        // End pattern not found yet -> partial
        return {
          status: 'partial',
          firstPotentialMatchIndex: matchStart,
        };
      }

      const filePath = buffer.slice(fileStart, fileEnd).trim();
      let consumedLength: number;
      const endOfPattern = fileEnd + END_PATTERN.length;

      // Require a newline after the end pattern. We don't want to leave a stray newline.
      if (buffer[endOfPattern] === '\n') {
        consumedLength = endOfPattern + 1;
      } else if (buffer[endOfPattern] === '\r' && buffer[endOfPattern + 1] === '\n') {
        // This case shouldn't really ever happen, but just in case we somehow receive a CRLF
        // sequence, we need to consume both characters.
        consumedLength = endOfPattern + 2;
      } else {
        // No required newline yet → partial
        return {
          status: 'partial',
          firstPotentialMatchIndex: matchStart,
        };
      }

      return {
        status: 'matched',
        events: [
          {
            type: 'token-metadata',
            metadata: {
              location: filePath,
            },
          },
        ],
        contextChanges: {
          currentCodeBlockUri: URI.random().toString(),
        },
        matchIndex: matchStart,
        matchLength: consumedLength,
      };
    }

    // Didn't find even a partial start -> no match
    return {
      status: 'no-match',
    };
  },
};
