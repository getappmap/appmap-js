/**
 * Process and sanitize a raw user-input stack trace. The output is an array of strings, each of the
 * form `path/to/file.ext(:<lineno>)?`, where lineno is an optional line number. The first (0th)
 * entry in the input stack is expected to be the deepest function. The output stack lines are in
 * the reverse order.
 *
 * @param stack raw stack trace input from the user.
 */
export function sanitizeStack(stack: string): string[] {
  const isNumeric = (n: string): boolean =>
    !isNaN(parseFloat(n)) && isFinite(parseFloat(n));

  const sanitize = (line: string): string => {
    const [path, lineno] = line.split(':', 2);
    const result = [path];
    if (isNumeric(lineno)) result.push(lineno);
    return result.join(':');
  };

  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map(sanitize)
    .reverse();
}
