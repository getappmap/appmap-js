export default function stripCodeFences(text: string): string {
  let sliceStart: number | undefined = undefined;
  let sliceEnd: number | undefined = undefined;
  if (text.match(/^`{3,}(.*)\n/)) {
    sliceStart = 1;
  }
  if (text.match(/\n`{3,}\s*?$/)) {
    sliceEnd = -1;
  }
  return text.split('\n').slice(sliceStart, sliceEnd).join('\n');
}
