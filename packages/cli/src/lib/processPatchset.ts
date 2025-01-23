/**
 * Examine all the diffs in a git diff output and replace long ones with a simple
 * message indicating that there is a change and its size.
 * @param patchset - The patchset to process.
 * @param maxDiffLength - The maximum length of a diff to include in the patchset.
 * @returns The processed patchset.
 */

export default function processPatchset(patchset: string, maxDiffLength = 5000): string {
  const parts = patchset.split(/^(?=diff|commit)/m);
  return parts
    .map((part) => {
      if (part.startsWith('diff')) {
        const lines = part.split('\n');
        const header = lines[0];
        const body = lines.slice(1).join('\n');
        if (body.length > maxDiffLength) {
          return `${header}\n[Change of size ${body.trimEnd().length}]\n`;
        }
      }
      return part;
    })
    .join('');
}
