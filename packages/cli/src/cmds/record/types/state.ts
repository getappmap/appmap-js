import RecordContext from '../recordContext';
import { FileName } from './fileName';

export type State = (recordContext: RecordContext) => Promise<State | FileName | undefined>;
