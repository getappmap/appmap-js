import { CodeObject } from '../search/types';

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

    codeObjectIds.forEach((id) => this.priorityByCodeObjectId.set(id, priority));
  }

  priorityOf(codeObject: CodeObject): number {
    let co: CodeObject | undefined = codeObject;
    while (co) {
      const priority = this.priorityByCodeObjectId.get(co.fqid);
      if (priority !== undefined) return priority;

      co = co.parent;
    }

    console.log(`No priority for code object ${codeObject.fqid}`);
    return MAX_PRIORITY;
  }
}
