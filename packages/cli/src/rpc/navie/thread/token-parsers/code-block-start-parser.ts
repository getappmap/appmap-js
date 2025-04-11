import { URI } from '@appland/rpc';
import { ParserEvent, StreamingParser } from '.';

export const CodeBlockStartParser: StreamingParser = {
  name: 'code block start',
  tryParse(buffer, context) {
    if (!context.currentCodeBlockFence) return { status: 'no-match' };

    // Match full code block opener: ```lang\n or ````\n
    const fullPattern = /(^|\n)(`{3,})([^\n`]+)?(\r?\n)/;
    const match = fullPattern.exec(buffer);
    if (match?.index !== undefined) {
      const [fullMatch, leadingNewline, fence, language] = match;
      const events: ParserEvent[] = [];

      if (language) {
        events.push({
          type: 'token-metadata',
          metadata: { language: language.trim() },
        });
      }

      events.push({
        type: 'token',
        token: fullMatch,
        messageId: context.messageId,
      });

      return {
        status: 'matched',
        events,
        contextChanges: {
          currentCodeBlockFence: fence,
          currentCodeBlockUri: URI.random().toString(),
        },
        matchIndex: leadingNewline.length + match.index,
        matchLength: fullMatch.length - leadingNewline.length,
      };
    }

    // Check for possible partial match: starts with line + 3+ backticks but incomplete
    const partialPattern = /(?:^|\n)(`+)([^\n`]*)?$/;
    const partialMatch = partialPattern.exec(buffer);
    if (partialMatch?.index !== undefined) {
      const backticks = partialMatch[1];
      const afterFence = partialMatch[2] ?? '';

      const isValidPartial =
        // 3 or more backticks → always a valid partial (even with trailing characters)
        backticks.length >= 3 ||
        // less than 3 backticks → only valid if not followed by non-newline characters
        (backticks.length < 3 && afterFence.length === 0);

      if (isValidPartial) {
        const partialIndex = partialMatch.index + (partialMatch[0].startsWith('\n') ? 1 : 0);
        return {
          status: 'partial',
          firstPotentialMatchIndex: partialIndex,
        };
      }
    }

    return { status: 'no-match' };
  },
};
