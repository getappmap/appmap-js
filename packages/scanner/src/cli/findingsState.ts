import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { exists } from '../../../cli/src/utils';

export enum FindingState {
  // Finding is valid, accepted and should be fixed.
  Active = 'active',
  // Finding will not be acted upon at this time. The comment should clarify why this is.
  Deferred = 'deferred',
  // Finding is a false positive. The code is working as designed.
  AsDesigned = 'as-designed',
}

export type FindingsState = Record<FindingState, FindingStateItem[]>;

export interface FindingStateItem {
  hash_v2: string;
  comment?: string;
  updated_at: Date;
}

export async function loadFindingsState(stateFileName: string): Promise<FindingsState> {
  let result: FindingsState;
  if (await exists(stateFileName)) {
    result = load(await readFile(stateFileName, 'utf8')) as FindingsState;
  } else {
    result = {
      [FindingState.Active]: [],
      [FindingState.Deferred]: [],
      [FindingState.AsDesigned]: [],
    } as FindingsState;
  }
  return result;
}
