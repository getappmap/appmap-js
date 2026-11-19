// yargs gives a string for an option used once and an array for one used several
// times. Returns the values as an array, or undefined if the option wasn't given.
export default function optionList(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}
