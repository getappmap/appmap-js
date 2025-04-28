/**
 * Checks for and removes the first and/or last lines if they match
 * the code fence pattern (```).
 * It also returns the indentation found on the opening fence line, if any.
 *
 * @param lines - An array of strings representing the lines of text.
 * @returns An object containing the lines potentially stripped of fences (`contentLines`)
 *          and the indentation string found preceding the opening fence (`openingIndent`),
 *          which will be null if no opening fence was found.
 */
export function removeFenceLines(lines: string[]): {
  contentLines: string[];
  openingIndent: string | null;
} {
  if (lines.length === 0) {
    return { contentLines: [], openingIndent: null };
  }

  const fenceRegex = /^(\s*)`{3,}/;
  const openingMatch = lines[0].match(fenceRegex);

  // Only check the last line if there's more than one line,
  // or if there's only one line and it didn't match the opening fence.
  // prettier-ignore
  const closingMatch = (lines.length > 1 || !openingMatch)
    ? lines[lines.length - 1].match(fenceRegex)
    : null;

  let start = 0;
  let end = lines.length;
  let openingIndent: string | null = null;

  if (openingMatch) {
    start = 1;
    openingIndent = openingMatch[1]; // Capture the indentation (whitespace)
  }

  if (closingMatch) {
    // Avoid reducing 'end' if the closing fence is the same line as a potential opening fence
    if (lines.length > 1 || !openingMatch) {
      end = lines.length - 1;
    }
  }

  // Ensure 'end' isn't less than 'start', which can happen if input is e.g., ["```", "```"]
  const finalEnd = Math.max(start, end);
  const contentLines = lines.slice(start, finalEnd);

  return { contentLines, openingIndent };
}

/**
 * Removes a specific leading indentation string from each line in an array.
 * If a line doesn't start with the exact indentation string, it's left unchanged.
 *
 * @param lines - The array of lines to dedent.
 * @param indentToRemove - The exact whitespace string to remove from the start of each line.
 * @returns A new array with lines dedented.
 */
export function dedentLines(lines: string[], indentToRemove: string): string[] {
  // If indent is empty string, null, or undefined, no dedentation needed.
  if (!indentToRemove) {
    return lines;
  }

  return lines.map((line) => {
    if (line.startsWith(indentToRemove)) {
      return line.slice(indentToRemove.length);
    }
    return line; // Leave line as-is if it doesn't start with the indent
  });
}

/**
 * Removes optional code fences (```) from the start and end of a string
 * and removes the leading indentation from the content lines, based *only*
 * on the indentation level of the opening fence line.
 *
 * @param text - The input string potentially containing code fences.
 * @returns The processed string with fences removed and content dedented.
 */
export default function stripCodeFences(text: string): string {
  const processedText = text.endsWith('\n') ? text.slice(0, -1) : text;

  // Handle empty string edge case after potential trimming
  if (processedText === '') {
    return '';
  }

  const lines = processedText.split('\n');

  // Step 1: Remove fence lines and detect opening indentation
  const { contentLines, openingIndent } = removeFenceLines(lines);

  // Step 2: Dedent the content lines based on the opening fence's indent
  //         (Only run dedent if an opening fence was actually found)
  const processedLines =
    openingIndent !== null ? dedentLines(contentLines, openingIndent) : contentLines;

  // Step 3: Join lines back together
  return processedLines.join('\n');
}
