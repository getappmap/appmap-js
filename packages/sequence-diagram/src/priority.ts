import { CodeObject } from './types';

const MAX_PRIORITY = 100000;

export default class Priority {
  patterns: string[] = [];
  priorityByCodeObjectGroupId = new Map<string, number>();
  sequenceByCodeObjectGroupId = new Map<string, number>();
  priorityByCodeObjectId = new Map<string, number>();
  basePriority = 0;

  constructor() {}

  enrollPattern(pattern: string) {
    this.patterns.push(pattern);
    this.priorityByCodeObjectGroupId.set(pattern, this.patterns.length * 1000);
    this.sequenceByCodeObjectGroupId.set(pattern, 0);
  }

  expandPattern(pattern: string, codeObjectIds: string[]) {
    const priority = this.priorityByCodeObjectGroupId.get(pattern);
    if (priority === undefined) {
      console.log(`No priority for pattern ${pattern}`);
      return;
    }

    codeObjectIds.forEach((id) => this.priorityByCodeObjectGroupId.set(id, priority));
  }

  setPriority(codeObjectId: string, priority: number) {
    this.priorityByCodeObjectGroupId.set(codeObjectId, priority);
  }

  priorityOf(codeObject: CodeObject): number {
    let priority = this.priorityByCodeObjectId.get(codeObject.fqid);
    if (priority) return priority;

    const groupPriority = this.groupPriority(codeObject);
    let sequence = this.sequenceByCodeObjectGroupId.get(codeObject.fqid);
    if (sequence === undefined) {
      sequence = 0;
      this.sequenceByCodeObjectGroupId.set(codeObject.fqid, sequence);
    } else {
      sequence += 1;
    }

    priority = groupPriority.basePriority + sequence;
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

    const basePriority = this.basePriority * 1000;
    this.basePriority += 1;
    this.priorityByCodeObjectGroupId.set(codeObject.fqid, basePriority);

    return { groupId: codeObject.fqid, basePriority: basePriority };
  }
}
