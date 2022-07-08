export default interface CommandOptions {
  verbose?: boolean;
  reportFile: string;
  directory?: string;
  appmapDir?: string;
  app?: string;
  mergeKey?: string;
  branch?: string;
  commit?: string;
  environment?: string;
}
