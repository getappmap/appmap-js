import { FileName } from './fileName';

export type State = () => Promise<State | FileName | undefined>;
