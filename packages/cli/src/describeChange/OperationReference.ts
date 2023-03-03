export class OperationReference {
  // Set of all source files, indexed by route ([<METHOD> <PATH> (<STATUS>)]).
  public sourcePathsByOperation = new Map<string, Set<string>>();

  static operationKey(method: string, path: string, status: number): string {
    return `${method.toUpperCase()} ${path} (${status})`;
  }
}
