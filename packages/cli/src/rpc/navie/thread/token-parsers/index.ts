import { NavieEvent, NavieTokenEvent, NavieTokenMetadataEvent } from '../events';
import { CodeBlockStartParser } from './code-block-start-parser';
import { FileCommentParser } from './file-comment-parser';

/**
 * Represents the parsing context provided to parsers.
 * This information helps parsers make context-aware decisions
 * (e.g., a code fence end should only match if currently inside a code block).
 */
export interface ParseContext {
  readonly messageId: string;
  /** The URI associated with the current context (file or code block). */
  currentCodeBlockUri?: string;
  /** The specific fence string used to open the current code block (e.g., '```' or '````'), if applicable. */
  currentCodeBlockFence?: string;
}

export type ParseContextChanges = Partial<Omit<ParseContext, 'messageId'>> | undefined;

/**
 * Represents the outcome of a single parser attempting to match at the beginning of a buffer.
 */
export type ParseResult =
  | {
      /** A complete pattern was successfully matched and parsed. */
      status: 'matched';
      /** An array of one or more events generated from the matched pattern. */
      events: ParserEvent[];
      /** The index in which the match started. */
      matchIndex: number;
      /** The length of the matched content */
      matchLength: number;
      /** Changes to be applied to the context once this parse result is accepted */
      contextChanges?: ParseContextChanges;
    }
  | {
      /** The start of the buffer potentially matches the parser's pattern, but more characters are needed to confirm. */
      // The 'partial' status itself signals the Thread tokens to continue buffering.
      status: 'partial';
      /** The first index where a potential match may occur. */
      firstPotentialMatchIndex: number;
    }
  | {
      /** The start of the buffer does not match this parser's pattern. */
      status: 'no-match';
    };

/**
 * Interface for a pluggable streaming parser module.
 *
 * Each implementation is responsible for recognizing *one* specific type of pattern
 * (e.g., file comments, specific XML-like tags, code fences) at the *beginning*
 * of the input buffer. It consumes the matched text and returns structured
 * emission objects.
 */
export interface StreamingParser {
  /**
   * A descriptive name for the parser (useful for debugging).
   */
  readonly name: string;

  /**
   * Attempts to parse a known pattern starting at the beginning of the provided buffer,
   * considering the current parsing context.
   *
   * @param buffer - The current text buffer available for parsing. Processing should only
   *                 consider the start of the buffer.
   * @param context - The current state of the parsing process (e.g., inside a code block).
   * @returns A ParseResult object indicating the outcome:
   *          - 'matched': If the pattern was fully matched, including the generated emissions
   *                       and the number of characters consumed.
   *          - 'partial': If the beginning of the buffer looks like the start of the pattern,
   *                       but more input is needed to confirm.
   *          - 'no-match': If the beginning of the buffer does not match this parser's pattern.
   */
  tryParse(buffer: string, context: Readonly<ParseContext>): ParseResult;
}

export type ParserEvent =
  | Omit<NavieTokenEvent, 'codeBlockUri'>
  | Omit<NavieTokenMetadataEvent, 'codeBlockUri'>;

export function processBuffer(
  buffer: string,
  parsers: StreamingParser[],
  context: ParseContext,
  emit: (event: NavieEvent) => void
): string {
  let remainingBuffer = buffer;

  while (remainingBuffer.length > 0) {
    let bestMatch: Extract<ParseResult, { status: 'matched' }> | undefined;
    let minimumPartialIndex = Infinity;

    // Try all parsers and pick the earliest match
    for (const parser of parsers) {
      const result = parser.tryParse(remainingBuffer, context);

      if (result.status === 'matched') {
        if (!bestMatch || result.matchIndex < bestMatch.matchIndex) {
          bestMatch = result;
        }
      } else if (result.status === 'partial') {
        minimumPartialIndex = Math.min(minimumPartialIndex, result.firstPotentialMatchIndex);
      }
    }

    if (bestMatch) {
      // Emit unmatched text before the match as a token
      if (bestMatch.matchIndex > 0) {
        const unmatched = remainingBuffer.slice(0, bestMatch.matchIndex);
        emit({
          type: 'token',
          token: unmatched,
          messageId: context.messageId,
          codeBlockUri: context.currentCodeBlockUri,
        } as NavieTokenEvent);
      }

      if (bestMatch.contextChanges) {
        // Apply context changes from the parser
        for (const [key, value] of Object.entries(bestMatch.contextChanges)) {
          if (context[key] === undefined) {
            // If the context key is not already set, set it to the new value
            context[key] = value;
          } else if (value === undefined) {
            // If the new value is explicitly undefined, remove the key from the context
            delete context[key];
          }
        }
      }

      // Emit matched events
      for (const event of bestMatch.events) {
        emit({ ...event, codeBlockUri: context.currentCodeBlockUri } as NavieEvent);
      }

      // Slice off the consumed part
      remainingBuffer = remainingBuffer.slice(bestMatch.matchIndex + bestMatch.matchLength);
    } else if (minimumPartialIndex !== Infinity) {
      // Emit everything up to the earliest potential partial match
      const nonMatching = remainingBuffer.slice(0, minimumPartialIndex);
      if (nonMatching.length > 0) {
        emit({
          type: 'token',
          token: nonMatching,
          messageId: context.messageId,
          codeBlockUri: context.currentCodeBlockUri,
        } as NavieTokenEvent);
        remainingBuffer = remainingBuffer.slice(nonMatching.length);
      }
      break;
    } else {
      // No matches or partials — emit everything as a token
      emit({
        type: 'token',
        token: remainingBuffer,
        messageId: context.messageId,
        codeBlockUri: context.currentCodeBlockUri,
      } as NavieTokenEvent);
      return '';
    }
  }

  return remainingBuffer;
}

export const TOKEN_PARSERS: StreamingParser[] = [FileCommentParser, CodeBlockStartParser];
