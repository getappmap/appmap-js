import ScanOptions from '../scanOptions';

export default interface CommandOptions extends ScanOptions {
  all: boolean;
  interactive: boolean;
  watch: boolean;
  appmapFile?: string | string[];
  ide?: string;
}
