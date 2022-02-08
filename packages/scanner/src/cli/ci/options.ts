import ScanOptions from '../scanOptions';

export default interface CommandOptions extends ScanOptions {
  fail?: boolean;
  upload: boolean;
  updateCommitStatus: boolean;
  mergeKey?: string;
}
