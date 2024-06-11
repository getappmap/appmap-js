export default function trimFences(text: string): string {
  const lineSeparator = text.includes('\r\n') ? '\r\n' : '\n';
  const openingFencePattern = /^```[a-z]*/;
  const closingFencePattern = /^```$/;

  const lines = text
    .split(lineSeparator)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  if (openingFencePattern.test(lines[0]) && closingFencePattern.test(lines[lines.length - 1])) {
    lines[0] = lines[0].replace(openingFencePattern, '');
    const startIndex = lines[0] === '' ? 1 : 0;
    return lines.slice(startIndex, -1).join(lineSeparator);
  }

  return text;
}

// TODO: Alternatively:
// const sanitizeContent = (fileUpdate: FileUpdate) => {
//   const { content } = fileUpdate;

//   const fenceRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
//   let match: RegExpExecArray | null;
//   const codeBlocks = new Array<string>();
//   while ((match = fenceRegex.exec(content)) !== null) {
//     codeBlocks.push(match[1]);
//   }
//   if (codeBlocks.length) fileUpdate.content = codeBlocks.join('\n');
// };
