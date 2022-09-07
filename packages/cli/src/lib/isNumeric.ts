export default function isNumeric(n: string): boolean {
  return !isNaN(parseFloat(n)) && isFinite(parseFloat(n));
}
