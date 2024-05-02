export default function contentAfter(text: string, start: string): string {
  const startIndex = text.indexOf(start);
  if (startIndex < 0) return text;

  return text.slice(startIndex + start.length);
}
