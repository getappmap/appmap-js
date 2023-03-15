import { CodeObject } from './types';
import Priority from './priority';
import { AppMap, CodeObject as AppMapCodeObject, CodeObjectType } from '@appland/models';

export type CodeObjectId = string;

export interface SequenceDiagramOptions {
  // default: []
  exclude?: CodeObjectId[];
  // default: []
  expand?: CodeObjectId[];

  // default: {}
  priority?: Record<CodeObjectId, number>;

  // default: []
  require?: CodeObjectId[];

  // Whether to combine repeated code segments into loops.
  // default: true
  loops?: boolean;
}

export default class Specification {
  public loops = true;
  private static readonly DefaultActorTypes: ReadonlyArray<CodeObjectType> = [
    'package',
    'database',
    'http',
    'external-service',
  ];

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

    const includeCodeObjects = (co: AppMapCodeObject): void => {
      if (!this.DefaultActorTypes.includes(co.type)) return;
      if (excludeSet.has(co.fqid)) return;

      if (co.parent && expandSet.has(co.parent.fqid)) {
        includedCodeObjectIds.add(co.fqid);
      } else if (!expandSet.has(co.fqid) && hasNonPackageChildren(co)) {
        includedCodeObjectIds.add(co.fqid);
      }

      co.children.forEach((child) => includeCodeObjects(child));
    };

    (appmap.classMap as any).roots.forEach((root: AppMapCodeObject) => includeCodeObjects(root));

    const requiredCodeObjectIds = new Set<string>(options.require || []);
    for (const coid of requiredCodeObjectIds) {
      includedCodeObjectIds.add(coid);
    }

    const priorityArg = options.priority || {};
    const priority = new Priority();

    if (!Object.keys(priorityArg).includes('http:HTTP server requests'))
      priorityArg['http:HTTP server requests'] = 0;

    {
      const externalServices = [...includedCodeObjectIds]
        .filter((coid) => coid.split(':')[0] === 'external-service')
        .sort();
      externalServices.push('database:Database');

      for (let index = 0; index < externalServices.length; index++) {
        const service = externalServices[index];
        if (!Object.keys(priorityArg).includes(service))
          priorityArg[service] = (includedCodeObjectIds.size + index + 1) * 1000;
      }
    }

    Object.entries(priorityArg || {}).forEach((entry) => priority.setPriority(entry[0], entry[1]));

    const spec = new Specification(priority, includedCodeObjectIds, requiredCodeObjectIds);
    spec.loops = !!options.loops;
    return spec;
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
