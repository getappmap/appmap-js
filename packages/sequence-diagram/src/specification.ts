import { CodeObject } from './types';
import Priority from './priority';
import { AppMap, CodeObject as AppMapCodeObject } from '@appland/models';

export type CodeObjectId = string;

export interface SequenceDiagramOptions {
  // default: []
  readonly exclude?: CodeObjectId[];
  // default: []
  readonly expand?: CodeObjectId[];

  // default: {}
  readonly priority?: Record<CodeObjectId, number>;

  // default: []
  readonly require?: CodeObjectId[];
}

export default class Specification {
  constructor(
    private priority: Priority,
    private includedCodeObjectIds: Set<CodeObjectId>,
    private requiredCodeObjectIds: Set<CodeObjectId>
  ) {}

  get hasRequiredCodeObjects(): boolean {
    return this.requiredCodeObjectIds.size > 0;
  }

  priorityOf(codeObject: CodeObject): number {
    return this.priority.priorityOf(codeObject);
  }

  isIncludedCodeObject(codeObject: CodeObject): CodeObject | undefined {
    return Specification.matchCodeObject(this.includedCodeObjectIds, codeObject);
  }

  isRequiredCodeObject(codeObject: CodeObject): CodeObject | undefined {
    return Specification.matchCodeObject(this.requiredCodeObjectIds, codeObject);
  }

  static build(appmap: AppMap, options: SequenceDiagramOptions): Specification {
    const excludeSet = new Set<string>(options.exclude || []);

    const expandSet = new Set<string>(options.expand || []);

    const includedCodeObjectIds = new Set<string>();

    const hasNonPackageChildren = (co: AppMapCodeObject): boolean => {
      if (co.type !== 'package') return true;

      return co.children.some((child) => child.type !== 'package');
    };

    const includeCodeObjects = (co: AppMapCodeObject, ancestors: string[]): void => {
      if (excludeSet.has(co.fqid)) return;

      if (co.parent && expandSet.has(co.parent.fqid)) {
        includedCodeObjectIds.add(co.fqid);
      } else if (!expandSet.has(co.fqid) && hasNonPackageChildren(co)) {
        includedCodeObjectIds.add(co.fqid);
      } else {
        ancestors.push(co.fqid);
        co.children.forEach((child) => includeCodeObjects(child, ancestors));
        ancestors.pop();
      }
    };

    (appmap.classMap as any).roots.forEach((root: AppMapCodeObject) =>
      includeCodeObjects(root, [])
    );

    const priority = new Priority();
    Object.entries(options.priority || {}).forEach((entry) =>
      priority.setPriority(entry[0], entry[1])
    );

    const requiredCodeObjectIds = new Set<string>(options.require || []);
    for (const coid of requiredCodeObjectIds) {
      includedCodeObjectIds.add(coid);
    }

    return new Specification(priority, includedCodeObjectIds, requiredCodeObjectIds);
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
