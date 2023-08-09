import { ImpactDomain, ScopeName } from '../../index';

export type Metadata = {
  title: string;
  impactDomain: ImpactDomain;
  references: Record<string, string>;
  labels?: string[];
  scope?: ScopeName;
  enumerateScope?: boolean;
};
