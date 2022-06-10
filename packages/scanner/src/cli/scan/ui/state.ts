import ScanContext from './scanContext';

export type State = (context: ScanContext) => Promise<State | undefined>;
