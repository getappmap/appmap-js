import { ImpactDomain, ScopeName } from '../../types';

export type Metadata = {
  title: string;
  impactDomain: ImpactDomain;
  references: Record<string, string>;
  labels?: string[];
  scope?: ScopeName;
  enumerateScope?: boolean;
};
