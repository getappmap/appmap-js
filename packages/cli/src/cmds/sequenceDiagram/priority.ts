const MAX_PRIORITY = 1000;

export default class Priority {
  patterns: string[] = [];
  priorityByCodeObjectId = new Map<string, number>();

  constructor() {
    this.priorityByCodeObjectId.set('http:HTTP server requests', 0);
  }

  enrollPattern(pattern: string) {
    this.patterns.push(pattern);
    this.priorityByCodeObjectId.set(pattern, this.patterns.length);
  }

  expandPattern(pattern: string, codeObjectIds: string[]) {
    const priority = this.priorityByCodeObjectId.get(pattern);
    if (priority === undefined) {
      console.log(`No priority for pattern ${pattern}`);
      return;
    }

    codeObjectIds.forEach((id) =>
      this.priorityByCodeObjectId.set(id, priority)
    );
  }

  priorityOf(codeObjectId: string): number {
    const priority = this.priorityByCodeObjectId.get(codeObjectId);
    if (priority === undefined) {
      console.log(`No priority for code object ${codeObjectId}`);
      return MAX_PRIORITY;
    }
    return priority;
  }
}
