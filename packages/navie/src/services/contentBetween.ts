export function contentBetween(text: string, start: string, end: string): string {
  const startIndex = text.indexOf(start);
  if (startIndex < 0) return text;

  const endIndex = text.indexOf(end, startIndex + start.length);
  if (endIndex < 0) return text;

  return text.slice(startIndex + start.length, endIndex);
}
