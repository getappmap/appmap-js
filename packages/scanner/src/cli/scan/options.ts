import ScanOptions from '../scanOptions';

export default interface CommandOptions extends ScanOptions {
  all: boolean;
  watch: boolean;
  appmapFile?: string | string[];
  ide?: string;
}
