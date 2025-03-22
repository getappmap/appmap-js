export function normalizeDate(date: string | number) {
  if (typeof date === 'number') {
    return new Date(date * 1000).toISOString();
  }
  return new Date(date).toISOString();
}
