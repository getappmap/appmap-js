import { ParseResult, StreamingParser } from '.';

export const CodeBlockEndParser: StreamingParser = {
  name: 'code block end',
  tryParse(buffer, context): ParseResult {
    const fence = context.currentCodeBlockFence;
    if (!fence) return { status: 'no-match' };

    // Look for exact fence at start of line
    const fenceStart = buffer.indexOf(fence);
    if (fenceStart === -1) return { status: 'no-match' };

    // Check that the fence is at the beginning of a line
    const isStartOfLine = fenceStart === 0 || buffer[fenceStart - 1] === '\n';
    if (!isStartOfLine) return { status: 'no-match' };

    // Ensure fence is followed only by optional whitespace and then newline or end of input
    const afterFence = buffer.slice(fenceStart + fence.length);
    const trailingMatch = /^[ \t]*(\r?\n|$)/.exec(afterFence);
    if (!trailingMatch) {
      // Might be a partial if buffer ends right after the fence
      if (buffer.endsWith(fence)) {
        return {
          status: 'partial',
          firstPotentialMatchIndex: fenceStart,
        };
      }
      return { status: 'no-match' };
    }

    const matchLength = fence.length + trailingMatch[0].length;
    const matchIndex = fenceStart;

    return {
      status: 'matched',
      events: [
        {
          type: 'token',
          token: buffer.slice(matchIndex, matchIndex + matchLength),
          messageId: context.messageId,
        },
      ],
      contextChanges: {
        currentCodeBlockFence: undefined,
        currentCodeBlockUri: undefined,
      },
      matchIndex,
      matchLength,
    };
  },
};
