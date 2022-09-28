let isVerbose = false;

export default function verbose(v?: boolean): boolean {
  if (v !== undefined) {
    isVerbose = v;
  }
  if (isVerbose === true || isVerbose === false) return isVerbose;
  return [process.env.DEBUG, process.env.APPMAP_DEBUG].includes('true');
}
