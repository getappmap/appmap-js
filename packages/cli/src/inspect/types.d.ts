import { FunctionStats } from '../search/types';

export interface Field {
  name: string;
  filterName: string;
  title: string;
  valueTitle: string;
}
export interface Filter {
  name: string;
  value: string;
}

export interface Console {
  question: (question: string, handler: (response: string) => void) => void;
}

export interface State {
  codeObjectId: string;
  codeObjectMatches: object[];
  filters: Filter[];
  stats: FunctionStats;
}
