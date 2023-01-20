export default interface ScanOptions {
  app?: string;
  apiKey?: string;
  directory?: string;
  appmapDir?: string;
  config: string;
  stateFile: string;
  reportFile: string;
  verbose?: boolean;
}
