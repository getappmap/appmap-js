export default function trimFences(text: string): string {
  const lineSeparator = text.includes('\r\n') ? '\r\n' : '\n';
  const openingFencePattern = /^```[a-z]*/;
  const closingFencePattern = /^```$/;

  const lines = text
    .split(lineSeparator)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  const firstLineContainingFence = lines.findIndex((line) => openingFencePattern.test(line));
  const rlines = lines.slice().reverse();
  const lastLineContainingFence = rlines.findIndex((line) => closingFencePattern.test(line));
  if (firstLineContainingFence === -1 || lastLineContainingFence === -1) {
    return text;
  }

  const startIndex = firstLineContainingFence + 1;
  const endIndex = lines.length - lastLineContainingFence - 1;
  return lines.slice(startIndex, endIndex).join(lineSeparator);
}
