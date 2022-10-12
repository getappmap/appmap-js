import { CodeObject } from '../search/types';
import { verbose } from '../utils';

const MAX_PRIORITY = 100000;

export default class Priority {
  patterns: string[] = [];
  priorityByCodeObjectGroupId = new Map<string, number>();
  priorityByCodeObjectId = new Map<string, number>();
  counter = 0;

  constructor() {
    this.priorityByCodeObjectGroupId.set('http:HTTP server requests', 0);
  }

  enrollPattern(pattern: string) {
    this.patterns.push(pattern);
    this.priorityByCodeObjectGroupId.set(pattern, this.patterns.length * 1000);
  }

  expandPattern(pattern: string, codeObjectIds: string[]) {
    const priority = this.priorityByCodeObjectGroupId.get(pattern);
    if (priority === undefined) {
      console.log(`No priority for pattern ${pattern}`);
      return;
    }

    codeObjectIds.forEach((id) => this.priorityByCodeObjectGroupId.set(id, priority));
  }

  priorityOf(codeObject: CodeObject): number {
    let priority = this.priorityByCodeObjectId.get(codeObject.fqid);
    if (priority) return priority;

    const groupPriority = this.groupPriority(codeObject);
    this.counter += 1;
    priority = groupPriority.basePriority + this.counter;
    this.priorityByCodeObjectId.set(codeObject.fqid, priority);
    return priority;
  }

  protected groupPriority(codeObject: CodeObject): { groupId: string; basePriority: number } {
    let co: CodeObject | undefined = codeObject;
    while (co) {
      const priority = this.priorityByCodeObjectGroupId.get(co.fqid);
      if (priority !== undefined) return { groupId: co.fqid, basePriority: priority };

      co = co.parent;
    }

    if (verbose()) console.log(`No priority for code object ${codeObject.fqid}`);
    return { groupId: codeObject.fqid, basePriority: MAX_PRIORITY };
  }
}
