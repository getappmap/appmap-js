export class FindingListItem {
  public readonly type = 'analysis-finding';
  constructor(public readonly resolvedFinding: ResolvedFinding) {}

  public get id(): string {
    return this.resolvedFinding.finding.hash_v2 || this.resolvedFinding.finding.hash;
  }

  public get fqid(): string {
    return `${this.type}:${this.id}`;
  }

  public get name(): string {
    return `${this.resolvedFinding.rule.title}: ${this.resolvedFinding.finding.message}`;
  }

  public get shortName(): string {
    return this.resolvedFinding.rule.title;
  }
}

export type ResolvedFinding = {
  finding: {
    hash: string;
    hash_v2?: string;
    message: string;
  };
  rule: {
    title: string;
  };
};

export default function toListItem(resolvedFinding: ResolvedFinding) {
  return new FindingListItem(resolvedFinding);
}
