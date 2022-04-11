import { ExitCode } from '../types/exitCode';
import { State } from '../types/state';

export default function abort(): Promise<State> {
  process.exit(ExitCode.Quit);
}
