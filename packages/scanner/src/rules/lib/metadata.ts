import { ImpactDomain, ImpactSubdomain, ScopeName } from '../../types';

export type Metadata = {
  title: string;
  impactDomain: ImpactDomain;
  impactSubdomains: ImpactSubdomain[];
  references: Record<string, string>;
  labels?: string[];
  scope?: ScopeName;
  enumerateScope?: boolean;
};
