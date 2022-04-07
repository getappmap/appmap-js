import { ImpactDomain, ScopeName } from '../../types';

export type Metadata = {
  title: string;
  scope: ScopeName;
  enumerateScope: boolean;
  impactDomain: ImpactDomain;
  references: Record<string, string>;
  labels?: string[];
};
