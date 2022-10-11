import { CodeObject } from '../search/types';
import Priority from './priority';

type CodeObjectId = string;

export default class Specification {
  constructor(
    public appmaps: string[],
    private priority: Priority,
    private includedCodeObjectIds: Set<CodeObjectId>,
    private requiredCodeObjectIds: Set<CodeObjectId>
  ) {}

  get hasRequiredCodeObjects(): boolean {
    return this.requiredCodeObjectIds.size > 0;
  }

  priorityOf(codeObject: CodeObject) {
    return this.priority.priorityOf(codeObject);
  }

  isIncludedCodeObject(codeObject: CodeObject): CodeObject | undefined {
    return Specification.matchCodeObject(this.includedCodeObjectIds, codeObject);
  }

  isRequiredCodeObject(codeObject: CodeObject): CodeObject | undefined {
    return Specification.matchCodeObject(this.requiredCodeObjectIds, codeObject);
  }

  protected static matchCodeObject(
    codeObjectIds: Set<CodeObjectId>,
    codeObject: CodeObject
  ): CodeObject | undefined {
    let co: CodeObject | undefined = codeObject;
    while (co) {
      if (codeObjectIds.has(co.fqid)) {
        return co;
      }
      co = co.parent;
    }
  }
}
