import { FindingState } from '../findingsState';
import ScanOptions from '../scanOptions';

export default interface CommandOptions extends ScanOptions {
  watch: boolean;
  appmapFile?: string | string[];
  findingState: [FindingState.AsDesigned | FindingState.Deferred][];
  ide?: string;
}
