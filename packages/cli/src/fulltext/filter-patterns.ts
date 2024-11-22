export function fileNameMatchesFilterPatterns(
  fileName: string,
  includePatterns: RegExp[] | undefined,
  excludePatterns: RegExp[] | undefined
) {
  if (includePatterns && !includePatterns.some((pattern) => pattern.test(fileName))) return false;

  if (excludePatterns?.some((pattern) => pattern.test(fileName))) return false;

  return true;
}
